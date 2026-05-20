from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Iterable

from openpyxl import load_workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.dimensions import ColumnDimension
from openpyxl.worksheet.pagebreak import Break
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Table, TableStyle


PLAN_LIBRARY = [
    {
        "id": "standard",
        "name": "标准清晰版",
        "description": "纵向优先，重复表头，适合正式归档。",
        "orientation": "portrait",
        "fitToWidth": 1,
        "repeatHeader": True,
        "freezeTopRow": True,
        "margin": "normal",
    },
    {
        "id": "landscape",
        "name": "宽表横向版",
        "description": "横向一页宽，适合明细表和台账。",
        "orientation": "landscape",
        "fitToWidth": 1,
        "repeatHeader": True,
        "freezeTopRow": True,
        "margin": "normal",
    },
    {
        "id": "compact",
        "name": "节纸紧凑版",
        "description": "窄页边距和紧凑缩放，减少分页。",
        "orientation": "landscape",
        "fitToWidth": 1,
        "repeatHeader": True,
        "freezeTopRow": True,
        "margin": "compact",
    },
    {
        "id": "split",
        "name": "分页阅读版",
        "description": "保留可读字号，按宽度分页。",
        "orientation": "landscape",
        "fitToWidth": 2,
        "repeatHeader": True,
        "freezeTopRow": True,
        "margin": "normal",
    },
    {
        "id": "summary",
        "name": "汇总展示版",
        "description": "纵向汇总输出，适合管理层查看。",
        "orientation": "portrait",
        "fitToWidth": 1,
        "repeatHeader": True,
        "freezeTopRow": False,
        "margin": "normal",
    },
    {
        "id": "manual",
        "name": "自定义打印版",
        "description": "保留高级设置入口，按用户参数输出。",
        "orientation": "landscape",
        "fitToWidth": 1,
        "repeatHeader": False,
        "freezeTopRow": False,
        "margin": "normal",
    },
]


def json_safe(value: Any) -> Any:
    if value is None:
        return ""
    if isinstance(value, (str, int, float, bool)):
        return value
    return str(value)


def used_range(sheet) -> tuple[int, int, int, int]:
    rows = []
    columns = []
    for row in sheet.iter_rows():
        for cell in row:
            if cell.value not in (None, ""):
                rows.append(cell.row)
                columns.append(cell.column)
    if not rows or not columns:
        return 1, 1, 1, 1
    return min(rows), min(columns), max(rows), max(columns)


def range_label(bounds: tuple[int, int, int, int]) -> str:
    min_row, min_col, max_row, max_col = bounds
    return f"{get_column_letter(min_col)}{min_row}:{get_column_letter(max_col)}{max_row}"


def sheet_preview(sheet, max_rows: int = 10, max_columns: int = 10) -> list[list[Any]]:
    min_row, min_col, max_row, max_col = used_range(sheet)
    rows = []
    for row in sheet.iter_rows(
        min_row=min_row,
        min_col=min_col,
        max_row=min(max_row, min_row + max_rows - 1),
        max_col=min(max_col, min_col + max_columns - 1),
        values_only=True,
    ):
        rows.append([json_safe(value) for value in row])
    return rows


def analyze_sheet(sheet) -> dict[str, Any]:
    bounds = used_range(sheet)
    min_row, min_col, max_row, max_col = bounds
    row_count = max_row - min_row + 1
    column_count = max_col - min_col + 1
    issues = []
    if column_count > 10:
        issues.append({"id": "wide", "label": "宽表建议横向打印"})
    if row_count > 35:
        issues.append({"id": "header", "label": "建议重复标题行"})
    if sheet.merged_cells.ranges:
        issues.append({"id": "merged", "label": "存在合并单元格"})
    if not sheet.print_area:
        issues.append({"id": "area", "label": "尚未设置打印区域"})
    return {
        "name": sheet.title,
        "range": range_label(bounds),
        "rows": row_count,
        "columns": column_count,
        "preview": sheet_preview(sheet),
        "issues": issues,
        "recommendedOrientation": "landscape" if column_count > 8 else "portrait",
        "hidden": sheet.sheet_state != "visible",
    }


def build_workbook_preview(source: str | Path) -> dict[str, Any]:
    source_path = Path(source)
    workbook = load_workbook(source_path, data_only=False)
    sheets = [analyze_sheet(sheet) for sheet in workbook.worksheets if sheet.sheet_state == "visible"]
    return {
        "filename": source_path.name,
        "sheetCount": len(sheets),
        "sheets": sheets,
        "plans": recommend_print_plans(sheets[0] if sheets else {}),
    }


def recommend_print_plans(sheet: dict[str, Any]) -> list[dict[str, Any]]:
    columns = sheet.get("columns", 0)
    rows = sheet.get("rows", 0)
    plans = [dict(plan) for plan in PLAN_LIBRARY]
    if columns > 8:
        plans.insert(0, plans.pop(1))
    elif rows < 25:
        plans.insert(0, plans.pop(4))
    return plans


def resolve_plan(plan: str | dict[str, Any]) -> dict[str, Any]:
    if isinstance(plan, dict):
        base = next((item for item in PLAN_LIBRARY if item["id"] == plan.get("id")), PLAN_LIBRARY[0])
        return {**base, **plan}
    return next((item for item in PLAN_LIBRARY if item["id"] == plan), PLAN_LIBRARY[0])


def preview_rows_per_page(config: dict[str, Any]) -> int:
    rows = 24 if config.get("orientation") == "landscape" else 32
    if config.get("margin") == "compact":
        rows += 6
    return rows


def preview_column_groups(min_col: int, max_col: int, fit_to_width: int) -> list[tuple[int, int]]:
    if fit_to_width <= 1:
        return [(min_col, max_col)]
    column_count = max_col - min_col + 1
    group_size = max(1, (column_count + fit_to_width - 1) // fit_to_width)
    return [
        (column_start, min(max_col, column_start + group_size - 1))
        for column_start in range(min_col, max_col + 1, group_size)
    ]


def page_cells(sheet, row_start: int, row_end: int, col_start: int, col_end: int) -> list[list[Any]]:
    return [
        [json_safe(value) for value in row]
        for row in sheet.iter_rows(
            min_row=row_start,
            max_row=row_end,
            min_col=col_start,
            max_col=col_end,
            values_only=True,
        )
    ]


def simulate_sheet_pages(sheet, config: dict[str, Any]) -> dict[str, Any]:
    min_row, min_col, max_row, max_col = used_range(sheet)
    rows_per_page = preview_rows_per_page(config)
    column_groups = preview_column_groups(min_col, max_col, int(config.get("fitToWidth") or 1))
    header = page_cells(sheet, min_row, min_row, min_col, max_col)[0]
    pages = []
    page_number = 1

    for col_start, col_end in column_groups:
        for row_start in range(min_row, max_row + 1, rows_per_page):
            row_end = min(max_row, row_start + rows_per_page - 1)
            rows = page_cells(sheet, row_start, row_end, col_start, col_end)
            if config.get("repeatHeader") and row_start > min_row:
                repeated_header = page_cells(sheet, min_row, min_row, col_start, col_end)
                rows = repeated_header + rows
            pages.append(
                {
                    "number": page_number,
                    "rowRange": f"{row_start}-{row_end}",
                    "columnRange": f"{get_column_letter(col_start)}-{get_column_letter(col_end)}",
                    "rows": rows[: min(len(rows), 12)],
                    "hasRepeatedHeader": bool(config.get("repeatHeader") and row_start > min_row),
                }
            )
            page_number += 1

    raw_rows_per_page = 18
    raw_column_pages = max(1, (max_col - min_col + 8) // 8)
    raw_row_pages = max(1, (max_row - min_row + raw_rows_per_page) // raw_rows_per_page)
    return {
        "name": sheet.title,
        "range": range_label((min_row, min_col, max_row, max_col)),
        "rows": max_row - min_row + 1,
        "columns": max_col - min_col + 1,
        "header": header,
        "pages": pages,
        "optimizedPageCount": len(pages),
        "originalPageCount": raw_column_pages * raw_row_pages,
    }


def build_print_preview(
    source: str | Path,
    selected_sheet_names: Iterable[str],
    plan: str | dict[str, Any],
) -> dict[str, Any]:
    selected_names = set(selected_sheet_names)
    config = resolve_plan(plan)
    workbook = load_workbook(source, data_only=False)
    sheets = [
        simulate_sheet_pages(sheet, config)
        for sheet in workbook.worksheets
        if sheet.title in selected_names and sheet.sheet_state == "visible"
    ]
    return {
        "plan": config,
        "selectedSheetCount": len(sheets),
        "originalPageCount": sum(sheet["originalPageCount"] for sheet in sheets),
        "optimizedPageCount": sum(sheet["optimizedPageCount"] for sheet in sheets),
        "sheets": sheets,
    }


def set_margins(sheet, margin: str) -> None:
    if margin == "compact":
        sheet.page_margins.left = 0.25
        sheet.page_margins.right = 0.25
        sheet.page_margins.top = 0.35
        sheet.page_margins.bottom = 0.35
    else:
        sheet.page_margins.left = 0.4
        sheet.page_margins.right = 0.4
        sheet.page_margins.top = 0.55
        sheet.page_margins.bottom = 0.55


def beautify_header(sheet, min_col: int, max_col: int) -> None:
    for cell in sheet[1][min_col - 1 : max_col]:
        cell.font = Font(
            name=cell.font.name,
            size=cell.font.size,
            bold=True,
            italic=cell.font.italic,
            color="FFFFFF",
        )
        cell.fill = PatternFill(fill_type="solid", fgColor="4F8A6B")
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)


def apply_print_plan(
    source: str | Path,
    output: str | Path,
    selected_sheet_names: Iterable[str],
    plan: str | dict[str, Any],
) -> Path:
    selected = set(selected_sheet_names)
    config = resolve_plan(plan)
    workbook = load_workbook(source)
    for sheet in workbook.worksheets:
        if sheet.title not in selected:
            continue
        bounds = used_range(sheet)
        min_row, min_col, max_row, max_col = bounds
        sheet.print_area = range_label(bounds)
        sheet.page_setup.orientation = config["orientation"]
        sheet.page_setup.fitToWidth = config["fitToWidth"]
        sheet.page_setup.fitToHeight = 0
        sheet.sheet_properties.pageSetUpPr.fitToPage = True
        sheet.print_options.horizontalCentered = False
        sheet.print_title_rows = "$1:$1" if config.get("repeatHeader") else None
        sheet.freeze_panes = "A2" if config.get("freezeTopRow") else None
        set_margins(sheet, config.get("margin", "normal"))
        sheet.row_breaks.brk = []
        for row_start in range(min_row + preview_rows_per_page(config), max_row + 1, preview_rows_per_page(config)):
            sheet.row_breaks.append(Break(id=row_start))
        beautify_header(sheet, min_col, max_col)
        for column in range(min_col, max_col + 1):
            letter = get_column_letter(column)
            current = sheet.column_dimensions[letter]
            if not isinstance(current, ColumnDimension) or current.width is None:
                sheet.column_dimensions[letter].width = 14
    output_path = Path(output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    workbook.save(output_path)
    return output_path


def pdf_data(sheet, max_columns: int = 12) -> list[list[str]]:
    preview = sheet_preview(sheet, max_rows=160, max_columns=max_columns)
    if not preview:
        return [["Empty sheet"]]
    return [[str(value)[:48] for value in row] for row in preview]


def safe_pdf_name(name: str) -> str:
    return re.sub(r"[^\w\u4e00-\u9fff -]+", "_", name)


def export_print_pdf(source: str | Path, output: str | Path, selected_sheet_names: Iterable[str]) -> Path:
    pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))
    source_path = Path(source)
    workbook = load_workbook(source_path, data_only=True)
    selected = [sheet for sheet in workbook.worksheets if sheet.title in set(selected_sheet_names)]
    output_path = Path(output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    document = SimpleDocTemplate(
        str(output_path),
        pagesize=landscape(A4),
        leftMargin=8 * mm,
        rightMargin=8 * mm,
        topMargin=10 * mm,
        bottomMargin=10 * mm,
    )
    styles = getSampleStyleSheet()
    styles["Title"].fontName = "STSong-Light"
    story = []
    for index, sheet in enumerate(selected):
        story.append(Paragraph(f"{safe_pdf_name(source_path.stem)} - {safe_pdf_name(sheet.title)}", styles["Title"]))
        data = pdf_data(sheet)
        column_width = (landscape(A4)[0] - 16 * mm) / max(1, len(data[0]))
        table = Table(data, repeatRows=1, colWidths=[column_width] * len(data[0]))
        table.setStyle(
            TableStyle(
                [
                    ("FONTNAME", (0, 0), (-1, -1), "STSong-Light"),
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4F8A6B")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#D8D2CF")),
                    ("FONTSIZE", (0, 0), (-1, -1), 7),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8F3EE")]),
                ]
            )
        )
        story.append(table)
        if index < len(selected) - 1:
            story.append(PageBreak())
    if not story:
        story.append(Paragraph("No sheets selected.", styles["Title"]))
    document.build(story)
    return output_path


def dumps(payload: dict[str, Any]) -> str:
    return json.dumps(payload, ensure_ascii=False)
