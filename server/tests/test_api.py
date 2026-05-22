import tempfile
import unittest
from pathlib import Path

from server import api


class ApiStorageTests(unittest.TestCase):
    def test_workbook_source_prefers_runtime_storage(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            runtime_root = Path(temp_dir) / "runtime-uploads"
            legacy_root = Path(temp_dir) / "legacy-uploads"
            workbook_id = "runtime-book"
            target = runtime_root / workbook_id
            target.mkdir(parents=True)
            source = target / "sales.xlsx"
            source.write_bytes(b"runtime")

            original_runtime = api.UPLOAD_ROOT
            original_legacy = api.LEGACY_UPLOAD_ROOT
            try:
                api.UPLOAD_ROOT = runtime_root
                api.LEGACY_UPLOAD_ROOT = legacy_root
                self.assertEqual(api.workbook_source(workbook_id), source)
            finally:
                api.UPLOAD_ROOT = original_runtime
                api.LEGACY_UPLOAD_ROOT = original_legacy

    def test_workbook_source_falls_back_to_legacy_storage(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            runtime_root = Path(temp_dir) / "runtime-uploads"
            legacy_root = Path(temp_dir) / "legacy-uploads"
            workbook_id = "legacy-book"
            target = legacy_root / workbook_id
            target.mkdir(parents=True)
            source = target / "sales.xlsx"
            source.write_bytes(b"legacy")

            original_runtime = api.UPLOAD_ROOT
            original_legacy = api.LEGACY_UPLOAD_ROOT
            try:
                api.UPLOAD_ROOT = runtime_root
                api.LEGACY_UPLOAD_ROOT = legacy_root
                self.assertEqual(api.workbook_source(workbook_id), source)
            finally:
                api.UPLOAD_ROOT = original_runtime
                api.LEGACY_UPLOAD_ROOT = original_legacy


if __name__ == "__main__":
    unittest.main()
