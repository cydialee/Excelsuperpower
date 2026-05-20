from __future__ import annotations

import cgi
import json
import mimetypes
import shutil
import traceback
import uuid
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

from server.excel_engine import (
    apply_print_plan,
    build_print_preview,
    build_workbook_preview,
    export_print_pdf,
    resolve_plan,
)


ROOT = Path(__file__).resolve().parents[1]
PREVIEW_ROOT = ROOT / "preview"
UPLOAD_ROOT = ROOT / "uploads"
OUTPUT_ROOT = ROOT / "outputs"
ALLOWED_SUFFIXES = {".xlsx", ".xlsm"}


def safe_filename(filename: str) -> str:
    name = Path(filename or "workbook.xlsx").name
    cleaned = "".join(char for char in name if char not in "\\/:*?\"<>|").strip()
    return cleaned or "workbook.xlsx"


def workbook_source(workbook_id: str) -> Path:
    folder = UPLOAD_ROOT / workbook_id
    sources = list(folder.glob("*"))
    if not sources:
        raise FileNotFoundError("Workbook not found")
    return sources[0]


class DemoHandler(SimpleHTTPRequestHandler):
    server_version = "ExcelsuperpowerDemo/0.1"

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
        if parsed.path.startswith("/outputs/"):
            return self.send_output_file(parsed.path.removeprefix("/outputs/"))
        if parsed.path.startswith("/api/workbooks/"):
            workbook_id = parsed.path.split("/")[-1]
            try:
                return self.send_json({"workbookId": workbook_id, **build_workbook_preview(workbook_source(workbook_id))})
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
        form = cgi.FieldStorage(
            fp=self.rfile,
            headers=self.headers,
            environ={
                "REQUEST_METHOD": "POST",
                "CONTENT_TYPE": self.headers.get("Content-Type"),
            },
        )
        file_item = form["file"] if "file" in form else None
        if file_item is None or not getattr(file_item, "filename", None):
            return self.send_error_json(HTTPStatus.BAD_REQUEST, "Missing Excel file")
        filename = safe_filename(file_item.filename)
        suffix = Path(filename).suffix.lower()
        if suffix not in ALLOWED_SUFFIXES:
            return self.send_error_json(HTTPStatus.BAD_REQUEST, "Demo backend supports .xlsx or .xlsm files")
        workbook_id = uuid.uuid4().hex
        target_dir = UPLOAD_ROOT / workbook_id
        target_dir.mkdir(parents=True, exist_ok=True)
        target = target_dir / filename
        with target.open("wb") as stream:
            shutil.copyfileobj(file_item.file, stream)
        return self.send_json({"workbookId": workbook_id, **build_workbook_preview(target)})

    def handle_optimize(self):
        body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", "0"))) or b"{}")
        workbook_id = body.get("workbookId")
        sheets = body.get("sheets") or []
        if not workbook_id or not sheets:
            return self.send_error_json(HTTPStatus.BAD_REQUEST, "workbookId and sheets are required")
        source = workbook_source(workbook_id)
        output_dir = OUTPUT_ROOT / workbook_id
        output_dir.mkdir(parents=True, exist_ok=True)
        plan = resolve_plan(body.get("plan") or "standard")
        optimized_name = f"{source.stem}-optimized.xlsx"
        pdf_name = f"{source.stem}-print.pdf"
        optimized = apply_print_plan(source, output_dir / optimized_name, sheets, plan)
        pdf = export_print_pdf(optimized, output_dir / pdf_name, sheets)
        return self.send_json(
            {
                "workbookId": workbook_id,
                "plan": plan,
                "preview": build_workbook_preview(optimized),
                "downloads": [
                    {"type": "xlsx", "label": "优化 Excel", "url": f"/outputs/{workbook_id}/{optimized.name}"},
                    {"type": "pdf", "label": "可打印 PDF", "url": f"/outputs/{workbook_id}/{pdf.name}"},
                ],
            }
        )

    def handle_preview_plan(self):
        body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", "0"))) or b"{}")
        workbook_id = body.get("workbookId")
        sheets = body.get("sheets") or []
        if not workbook_id or not sheets:
            return self.send_error_json(HTTPStatus.BAD_REQUEST, "workbookId and sheets are required")
        preview = build_print_preview(workbook_source(workbook_id), sheets, body.get("plan") or "standard")
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
        file_path = (OUTPUT_ROOT / unquote(relative_path)).resolve()
        if OUTPUT_ROOT.resolve() not in file_path.parents:
            return self.send_error_json(HTTPStatus.FORBIDDEN, "Invalid output path")
        if not file_path.exists() or file_path.is_dir():
            return self.send_error_json(HTTPStatus.NOT_FOUND, "Output not found")
        return self.send_file(file_path)

    def send_file(self, file_path: Path):
        content_type = mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"
        payload = file_path.read_bytes()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(payload)))
        if file_path.suffix in {".xlsx", ".pdf"}:
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
    print(f"Excelsuperpower demo server: http://{host}:{port}/")
    server.serve_forever()


if __name__ == "__main__":
    run()
