from __future__ import annotations

import json
import mimetypes
import os
import sys
import tempfile
import time
import traceback
import uuid
from email import policy
from email.parser import BytesParser
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

try:
    from server.excel_engine import (
        apply_print_plan,
        build_print_preview,
        build_sheet_detail,
        build_workbook_preview,
        export_macro_workbook,
        export_print_pdf,
        resolve_plan,
    )
except ModuleNotFoundError:
    PROJECT_ROOT = Path(__file__).resolve().parents[1]
    if str(PROJECT_ROOT) not in sys.path:
        sys.path.insert(0, str(PROJECT_ROOT))
    from server.excel_engine import (
        apply_print_plan,
        build_print_preview,
        build_sheet_detail,
        build_workbook_preview,
        export_macro_workbook,
        export_print_pdf,
        resolve_plan,
    )


ROOT = Path(__file__).resolve().parents[1]
PREVIEW_ROOT = ROOT / "preview"
RUNTIME_ROOT = Path(os.environ.get("EXCELSUPERPOWER_RUNTIME_DIR") or (Path(tempfile.gettempdir()) / "ExcelsuperpowerDemo"))
UPLOAD_ROOT = RUNTIME_ROOT / "uploads"
OUTPUT_ROOT = RUNTIME_ROOT / "outputs"
LEGACY_UPLOAD_ROOT = ROOT / "uploads"
LEGACY_OUTPUT_ROOT = ROOT / "outputs"
ALLOWED_SUFFIXES = {".xlsx", ".xlsm"}


def log_event(message: str) -> None:
    print(f"[Excelsuperpower] {message}", flush=True)


def safe_filename(filename: str) -> str:
    name = Path(filename or "workbook.xlsx").name
    cleaned = "".join(char for char in name if char not in "\\/:*?\"<>|").strip()
    return cleaned or "workbook.xlsx"


def workbook_source(workbook_id: str) -> Path:
    for root in (UPLOAD_ROOT, LEGACY_UPLOAD_ROOT):
        folder = root / workbook_id
        sources = list(folder.glob("*"))
        if sources:
            return sources[0]
    raise FileNotFoundError("Workbook not found")


def selected_targets(body: dict) -> list:
    return body.get("printTargets") or body.get("sheets") or []


def read_upload_file(handler: SimpleHTTPRequestHandler) -> tuple[str, bytes]:
    content_type = handler.headers.get("Content-Type", "")
    content_length = int(handler.headers.get("Content-Length", "0"))
    body = handler.rfile.read(content_length)
    message = BytesParser(policy=policy.default).parsebytes(
        f"Content-Type: {content_type}\r\nMIME-Version: 1.0\r\n\r\n".encode("utf-8") + body
    )
    for part in message.iter_parts():
        if part.get_param("name", header="content-disposition") == "file":
            filename = part.get_filename()
            payload = part.get_payload(decode=True) or b""
            if filename:
                return filename, payload
    raise ValueError("Missing Excel file")


class DemoHandler(SimpleHTTPRequestHandler):
    server_version = "ExcelsuperpowerDemo/0.1"

    def log_message(self, format: str, *args):
        log_event(f'{self.address_string()} - "{format % args}"')

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(HTTPStatus.NO_CONTENT)
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/health":
            return self.send_json({"ok": True})
        if parsed.path.startswith("/outputs/"):
            return self.send_output_file(parsed.path.removeprefix("/outputs/"))
        if parsed.path.startswith("/api/workbooks/"):
            workbook_id = parsed.path.split("/")[-1]
            try:
                query = parse_qs(parsed.query)
                sheet_name = query.get("sheet", [None])[0]
                if sheet_name:
                    return self.send_json(
                        {"workbookId": workbook_id, "sheet": build_sheet_detail(workbook_source(workbook_id), sheet_name)}
                    )
                return self.send_json(
                    {"workbookId": workbook_id, **build_workbook_preview(workbook_source(workbook_id), include_grids=False)}
                )
            except Exception as error:  # noqa: BLE001
                return self.send_error_json(HTTPStatus.NOT_FOUND, str(error))
        return self.send_preview_file(parsed.path)

    def do_POST(self):
        parsed = urlparse(self.path)
        try:
            if parsed.path == "/api/upload":
                return self.handle_upload()
            if parsed.path == "/api/preview-plan":
                return self.handle_preview_plan()
            if parsed.path == "/api/optimize":
                return self.handle_optimize()
            return self.send_error_json(HTTPStatus.NOT_FOUND, "Unknown API route")
        except Exception as error:  # noqa: BLE001
            traceback.print_exc()
            return self.send_error_json(HTTPStatus.BAD_REQUEST, str(error))

    def handle_upload(self):
        started_at = time.perf_counter()
        uploaded_name, payload = read_upload_file(self)
        filename = safe_filename(uploaded_name)
        suffix = Path(filename).suffix.lower()
        if suffix not in ALLOWED_SUFFIXES:
            return self.send_error_json(HTTPStatus.BAD_REQUEST, "Demo backend supports .xlsx or .xlsm files")
        workbook_id = uuid.uuid4().hex
        target_dir = UPLOAD_ROOT / workbook_id
        target_dir.mkdir(parents=True, exist_ok=True)
        target = target_dir / filename
        log_event(f"upload:start workbook_id={workbook_id} filename={filename} size={len(payload)}")
        target.write_bytes(payload)
        preview = build_workbook_preview(target, include_grids=False)
        elapsed_ms = round((time.perf_counter() - started_at) * 1000, 1)
        log_event(
            f"upload:done workbook_id={workbook_id} sheets={preview.get('sheetCount', 0)} elapsed_ms={elapsed_ms}"
        )
        return self.send_json({"workbookId": workbook_id, **preview})

    def handle_optimize(self):
        body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", "0"))) or b"{}")
        workbook_id = body.get("workbookId")
        targets = selected_targets(body)
        if not workbook_id or not targets:
            return self.send_error_json(HTTPStatus.BAD_REQUEST, "workbookId and print targets are required")
        source = workbook_source(workbook_id)
        output_dir = OUTPUT_ROOT / workbook_id
        output_dir.mkdir(parents=True, exist_ok=True)
        plan = resolve_plan(body.get("plan") or "standard")
        optimized_name = f"{source.stem}-optimized.xlsx"
        macro_name = f"{source.stem}-batch-print.xlsm"
        pdf_name = f"{source.stem}-print.pdf"
        optimized = apply_print_plan(source, output_dir / optimized_name, targets, plan)
        pdf = export_print_pdf(optimized, output_dir / pdf_name, targets, plan)

        downloads = [
            {"type": "xlsx", "label": "优化 Excel", "url": f"/outputs/{workbook_id}/{optimized.name}"},
        ]
        warnings: list[str] = []
        try:
            macro = export_macro_workbook(optimized, output_dir / macro_name, targets, plan)
            downloads.append(
                {"type": "xlsm", "label": "VBA 一键打印 Excel", "url": f"/outputs/{workbook_id}/{macro.name}"}
            )
        except Exception as error:  # noqa: BLE001
            warnings.append(f"VBA 宏导出失败：{error}")
        downloads.append({"type": "pdf", "label": "可打印 PDF", "url": f"/outputs/{workbook_id}/{pdf.name}"})

        return self.send_json(
            {
                "workbookId": workbook_id,
                "plan": plan,
                "preview": build_print_preview(optimized, targets, plan),
                "workbook": build_workbook_preview(optimized),
                "downloads": downloads,
                "warnings": warnings,
            }
        )

    def handle_preview_plan(self):
        body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", "0"))) or b"{}")
        workbook_id = body.get("workbookId")
        targets = selected_targets(body)
        if not workbook_id or not targets:
            return self.send_error_json(HTTPStatus.BAD_REQUEST, "workbookId and print targets are required")
        preview = build_print_preview(workbook_source(workbook_id), targets, body.get("plan") or "standard")
        return self.send_json({"workbookId": workbook_id, "preview": preview})

    def send_preview_file(self, request_path: str):
        path = request_path if request_path not in ("", "/") else "/index.html"
        file_path = (PREVIEW_ROOT / unquote(path.lstrip("/"))).resolve()
        if PREVIEW_ROOT.resolve() not in file_path.parents and file_path != PREVIEW_ROOT.resolve():
            return self.send_error_json(HTTPStatus.FORBIDDEN, "Invalid preview path")
        if not file_path.exists() or file_path.is_dir():
            return self.send_error_json(HTTPStatus.NOT_FOUND, "Preview file not found")
        return self.send_file(file_path)

    def send_output_file(self, relative_path: str):
        relative = unquote(relative_path)
        for root in (OUTPUT_ROOT, LEGACY_OUTPUT_ROOT):
            file_path = (root / relative).resolve()
            if root.resolve() not in file_path.parents:
                continue
            if file_path.exists() and not file_path.is_dir():
                return self.send_file(file_path)
        return self.send_error_json(HTTPStatus.NOT_FOUND, "Output not found")

    def send_file(self, file_path: Path):
        content_type = mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"
        payload = file_path.read_bytes()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(payload)))
        if file_path.suffix in {".xlsx", ".xlsm", ".pdf"}:
            self.send_header("Content-Disposition", f'attachment; filename="{file_path.name}"')
        self.end_headers()
        self.wfile.write(payload)

    def send_json(self, payload: dict, status: HTTPStatus = HTTPStatus.OK):
        encoded = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def send_error_json(self, status: HTTPStatus, message: str):
        return self.send_json({"error": message}, status)


def run(host: str = "127.0.0.1", port: int = 4173):
    UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    server = ThreadingHTTPServer((host, port), DemoHandler)
    log_event(f"demo server: http://{host}:{port}/")
    log_event(f"runtime storage: {RUNTIME_ROOT}")
    server.serve_forever()


if __name__ == "__main__":
    run()
