import tempfile
import unittest
from pathlib import Path

from openpyxl import Workbook, load_workbook

from server.excel_engine import (
    apply_print_plan,
    build_print_preview,
    build_workbook_preview,
    export_print_pdf,
    recommend_print_plans,
)


class ExcelEngineTests(unittest.TestCase):
    def make_workbook(self, root: Path) -> Path:
        workbook = Workbook()
        sheet = workbook.active
        sheet.title = "Sales"
        sheet.append(["Order", "Customer", "Region", "Amount", "Owner", "Status"])
        for index in range(1, 45):
            sheet.append([index, f"Customer {index}", "East", index * 12.5, "Lee", "Done"])
        notes = workbook.create_sheet("Notes")
        notes.append(["Info", "Value"])
        notes.append(["Quarter", "Q2"])
        path = root / "sales.xlsx"
        workbook.save(path)
        return path

    def test_preview_reads_real_sheet_names_ranges_and_cells(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            source = self.make_workbook(Path(temp_dir))

            preview = build_workbook_preview(source)

            self.assertEqual(preview["filename"], "sales.xlsx")
            self.assertEqual([sheet["name"] for sheet in preview["sheets"]], ["Sales", "Notes"])
            self.assertEqual(preview["sheets"][0]["range"], "A1:F45")
            self.assertEqual(preview["sheets"][0]["preview"][0][0], "Order")

    def test_recommended_plans_include_print_ready_choices(self):
        plans = recommend_print_plans(
            {
                "name": "Sales",
                "rows": 45,
                "columns": 6,
                "range": "A1:F45",
            }
        )

        self.assertGreaterEqual(len(plans), 5)
        self.assertEqual(plans[0]["id"], "standard")

    def test_apply_plan_sets_print_area_titles_orientation_and_outputs_xlsx(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            source = self.make_workbook(root)
            output = root / "optimized.xlsx"

            apply_print_plan(
                source,
                output,
                ["Sales"],
                {
                    "id": "landscape",
                    "orientation": "landscape",
                    "fitToWidth": 1,
                    "repeatHeader": True,
                    "freezeTopRow": True,
                },
            )

            workbook = load_workbook(output)
            sheet = workbook["Sales"]
            self.assertEqual(sheet.print_area, "'Sales'!$A$1:$F$45")
            self.assertEqual(sheet.print_title_rows, "$1:$1")
            self.assertEqual(sheet.page_setup.orientation, "landscape")
            self.assertEqual(sheet.freeze_panes, "A2")
            self.assertEqual([page_break.id for page_break in sheet.row_breaks.brk], [25])

    def test_print_preview_simulates_pages_before_generation(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            source = self.make_workbook(Path(temp_dir))

            preview = build_print_preview(
                source,
                ["Sales"],
                {
                    "id": "landscape",
                    "orientation": "landscape",
                    "fitToWidth": 1,
                    "repeatHeader": True,
                },
            )

            self.assertEqual(preview["selectedSheetCount"], 1)
            self.assertEqual(preview["optimizedPageCount"], 2)
            self.assertGreater(preview["originalPageCount"], preview["optimizedPageCount"])
            self.assertEqual(preview["sheets"][0]["pages"][0]["rowRange"], "1-24")
            self.assertEqual(preview["sheets"][0]["pages"][1]["rows"][0][0], "Order")
            self.assertEqual(preview["sheets"][0]["pages"][1]["rows"][1][0], 24)

    def test_pdf_export_writes_printable_pdf_bytes(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            source = self.make_workbook(root)
            output = root / "print.pdf"

            export_print_pdf(source, output, ["Sales"])

            self.assertTrue(output.exists())
            self.assertTrue(output.read_bytes().startswith(b"%PDF"))


if __name__ == "__main__":
    unittest.main()
