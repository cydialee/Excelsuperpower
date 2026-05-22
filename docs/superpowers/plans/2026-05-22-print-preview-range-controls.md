# Print Preview Range Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Excel previews range-aware and trustworthy, preserve merged cells, expose richer print fitting controls, and ship a free baseline AI beautification mode.

**Architecture:** Extend the Python print engine first so every downstream operation can accept a per-Sheet print target with an A1 range while remaining compatible with existing Sheet-name requests. The mini program and browser preview then keep selected targets in session state, expose range editing during analysis, and send fitting and beautification settings to the same API. Preview rendering gains explicit merged-cell metadata and formula-result status rather than flattening workbook structure.

**Tech Stack:** Python `openpyxl` and `reportlab`, native WeChat Mini Program JavaScript/WXML/WXSS, Node test runner, Python `unittest`, local HTML preview served by `server.api`.

---

## File Map

- `server/excel_engine.py`: range parsing, value preview, merged metadata, page fitting, workbook output, PDF source rows, baseline beautification.
- `server/api.py`: backward-compatible print target request handling for preview and optimize routes.
- `server/tests/test_excel_engine.py`: engine regression coverage for formulas, merged cells, ranges, fitting, and beautification.
- `miniprogram/utils/workflow.js`: demo session print targets and expanded print settings defaults.
- `tests/workflow.test.js`: workflow session and settings payload coverage.
- `miniprogram/pages/analyze/analyze.js`: selected target state and range validation actions.
- `miniprogram/pages/analyze/analyze.wxml`: analyze-step range controls and preview status.
- `miniprogram/pages/analyze/analyze.wxss`: range editor layout that follows the current page style.
- `miniprogram/pages/settings/settings.js`: expanded print fitting and beautification setting handlers.
- `miniprogram/pages/settings/settings.wxml`: print mode controls and additional toggles.
- `miniprogram/pages/settings/settings.wxss`: settings control layout.
- `miniprogram/pages/compare/compare.js`: send print targets to preview API.
- `preview/index.html`: browser MVP parity for print targets, fitting controls, and range-aware previews while preserving any existing local edits.
- `tests/preview.test.js`: browser preview markup/script checks if the existing test is adopted by the change.

### Task 1: Range-Aware Engine Contract

**Files:**
- Modify: `server/tests/test_excel_engine.py`
- Modify: `server/excel_engine.py`

- [ ] **Step 1: Write failing range tests**

Add tests that request a selected target with a subrange and assert preview and workbook output stay inside it:

```python
def test_print_target_range_controls_preview_and_output_area(self):
    with tempfile.TemporaryDirectory() as temp_dir:
        root = Path(temp_dir)
        source = self.make_workbook(root)
        output = root / "range-output.xlsx"

        preview = build_print_preview(
            source,
            [{"sheet": "Sales", "range": "B2:D8", "rangeSource": "manual"}],
            {"id": "landscape", "orientation": "landscape", "fitToWidth": 1, "repeatHeader": True},
        )
        apply_print_plan(
            source,
            output,
            [{"sheet": "Sales", "range": "B2:D8", "rangeSource": "manual"}],
            {"id": "landscape", "orientation": "landscape", "fitToWidth": 1, "repeatHeader": True},
        )

        workbook = load_workbook(output)
        self.assertEqual(preview["sheets"][0]["range"], "B2:D8")
        self.assertEqual(preview["sheets"][0]["rows"], 7)
        self.assertEqual(workbook["Sales"].print_area, "'Sales'!$B$2:$D$8")
```

- [ ] **Step 2: Run the focused failing test**

Run: `python -m unittest server.tests.test_excel_engine.ExcelEngineTests.test_print_target_range_controls_preview_and_output_area -v`

Expected: FAIL because `build_print_preview` and `apply_print_plan` still assume selected Sheet names and used ranges.

- [ ] **Step 3: Add print-target helpers**

Implement helpers in `server/excel_engine.py` that normalize legacy string Sheet names and dictionary targets, parse A1 ranges with `openpyxl.utils.range_boundaries`, and fall back to `used_range(sheet)` when no range is supplied:

```python
def normalize_print_targets(selected_sheets: Iterable[str | dict[str, Any]]) -> list[dict[str, Any]]:
    targets = []
    for item in selected_sheets:
        if isinstance(item, str):
            targets.append({"sheet": item, "range": None, "rangeSource": "auto"})
            continue
        sheet_name = item.get("sheet") or item.get("name")
        if sheet_name:
            targets.append({"sheet": sheet_name, "range": item.get("range"), "rangeSource": item.get("rangeSource", "auto")})
    return targets
```

Use explicit bounds in page simulation and workbook `print_area` writing instead of always calling `used_range(sheet)`.

- [ ] **Step 4: Re-run the focused test**

Run: `python -m unittest server.tests.test_excel_engine.ExcelEngineTests.test_print_target_range_controls_preview_and_output_area -v`

Expected: PASS.

- [ ] **Step 5: Run existing engine tests**

Run: `python -m unittest server.tests.test_excel_engine -v`

Expected: PASS with legacy Sheet-name tests still green.

### Task 2: Formula Results and Merged Preview Metadata

**Files:**
- Modify: `server/tests/test_excel_engine.py`
- Modify: `server/excel_engine.py`

- [ ] **Step 1: Write failing preview structure tests**

Add a workbook fixture with a formula cell and merged header:

```python
def test_workbook_preview_reports_merged_cells_and_formula_status(self):
    with tempfile.TemporaryDirectory() as temp_dir:
        root = Path(temp_dir)
        workbook = Workbook()
        sheet = workbook.active
        sheet.title = "Formula"
        sheet.merge_cells("A1:B1")
        sheet["A1"] = "Total"
        sheet["A2"] = 3
        sheet["B2"] = 4
        sheet["C2"] = "=A2+B2"
        source = root / "formula.xlsx"
        workbook.save(source)

        preview = build_workbook_preview(source)
        formula_sheet = preview["sheets"][0]

        self.assertEqual(formula_sheet["mergedCells"][0]["range"], "A1:B1")
        self.assertEqual(formula_sheet["formulaWarnings"][0]["cell"], "C2")
        self.assertEqual(formula_sheet["preview"][1][2], "")
```

- [ ] **Step 2: Run the failing preview test**

Run: `python -m unittest server.tests.test_excel_engine.ExcelEngineTests.test_workbook_preview_reports_merged_cells_and_formula_status -v`

Expected: FAIL because preview payloads do not expose merge or formula-warning metadata.

- [ ] **Step 3: Read display and formula workbooks together**

Load a formula workbook with `data_only=False` and a display workbook with `data_only=True`. Add helpers that:

```python
def merged_cells_in_bounds(sheet, bounds):
    min_row, min_col, max_row, max_col = bounds
    merged = []
    for region in sheet.merged_cells.ranges:
        intersects = not (
            region.max_row < min_row
            or region.min_row > max_row
            or region.max_col < min_col
            or region.min_col > max_col
        )
        if intersects:
            merged.append(
                {
                    "range": str(region),
                    "minRow": region.min_row,
                    "minColumn": region.min_col,
                    "maxRow": region.max_row,
                    "maxColumn": region.max_col,
                }
            )
    return merged

def preview_formula_warnings(formula_sheet, value_sheet, bounds):
    min_row, min_col, max_row, max_col = bounds
    warnings = []
    for row in formula_sheet.iter_rows(min_row=min_row, min_col=min_col, max_row=max_row, max_col=max_col):
        for formula_cell in row:
            if isinstance(formula_cell.value, str) and formula_cell.value.startswith("="):
                value_cell = value_sheet.cell(formula_cell.row, formula_cell.column)
                if value_cell.value is None:
                    warnings.append({"cell": formula_cell.coordinate, "status": "cached-value-missing"})
    return warnings
```

Use value workbook rows for displayed preview values and formula workbook cells for warning detection and merge metadata.

- [ ] **Step 4: Keep page preview metadata aligned**

Add `mergedCells` and `formulaWarnings` to `simulate_sheet_pages` output for the active print range so the browser and mini program can show the same status for page preview.

- [ ] **Step 5: Verify formula and merged tests**

Run: `python -m unittest server.tests.test_excel_engine -v`

Expected: PASS.

### Task 3: Fit Modes and Free Beautification Rules

**Files:**
- Modify: `server/tests/test_excel_engine.py`
- Modify: `server/excel_engine.py`

- [ ] **Step 1: Write failing fit and beautification tests**

Add assertions for the three page fitting modes and baseline beautification:

```python
def test_apply_plan_writes_fit_height_and_ai_beautification(self):
    with tempfile.TemporaryDirectory() as temp_dir:
        root = Path(temp_dir)
        source = self.make_workbook(root)
        output = root / "beautified.xlsx"
        apply_print_plan(
            source,
            output,
            ["Sales"],
            {
                "id": "manual",
                "fitMode": "all-rows",
                "fitToWidth": 0,
                "fitToHeight": 1,
                "aiBeautify": True,
                "repeatHeader": True,
                "orientation": "portrait",
            },
        )
        sheet = load_workbook(output)["Sales"]
        self.assertEqual(sheet.page_setup.fitToWidth, 0)
        self.assertEqual(sheet.page_setup.fitToHeight, 1)
        self.assertTrue(sheet["A1"].font.bold)
        self.assertIsNotNone(sheet["A2"].border.bottom.style)
```

- [ ] **Step 2: Run the failing focused test**

Run: `python -m unittest server.tests.test_excel_engine.ExcelEngineTests.test_apply_plan_writes_fit_height_and_ai_beautification -v`

Expected: FAIL because fit height is hard-coded to `0` and baseline body styling is missing.

- [ ] **Step 3: Implement fitting intent**

Let resolved plans carry `fitToHeight`, `fitMode`, centering, paper, and gridline options. Update `apply_print_plan` and the simulator so:

```python
sheet.page_setup.fitToWidth = config.get("fitToWidth", 1)
sheet.page_setup.fitToHeight = config.get("fitToHeight", 0)
sheet.print_options.gridLines = bool(config.get("gridline"))
sheet.print_options.horizontalCentered = bool(config.get("horizontalCentered"))
sheet.print_options.verticalCentered = bool(config.get("verticalCentered"))
```

Use fit mode to compute preview row/column grouping without changing legacy plans.

- [ ] **Step 4: Implement free beautification**

Gate header and body appearance under `aiBeautify` for the new baseline mode. Keep the baseline deterministic: header emphasis, readable fill, alignment, borders, fallback widths, and restrained alternating row fill for the selected range only.

- [ ] **Step 5: Run engine tests**

Run: `python -m unittest server.tests.test_excel_engine -v`

Expected: PASS.

### Task 4: API Print Targets

**Files:**
- Modify: `server/api.py`
- Modify: `server/tests/test_excel_engine.py`

- [ ] **Step 1: Write failing target extraction tests**

Add a small API helper test in `server/tests/test_excel_engine.py` by importing `selected_targets` from `server.api` and asserting new payloads win while legacy payloads remain accepted:

```python
def test_selected_targets_prefers_range_targets_and_keeps_legacy_sheets(self):
    self.assertEqual(
        selected_targets({"printTargets": [{"sheet": "Sales", "range": "B2:D8"}], "sheets": ["Sales"]}),
        [{"sheet": "Sales", "range": "B2:D8"}],
    )
    self.assertEqual(selected_targets({"sheets": ["Sales"]}), ["Sales"])
```

- [ ] **Step 2: Run the failing target extraction test**

Run: `python -m unittest server.tests.test_excel_engine.ExcelEngineTests.test_selected_targets_prefers_range_targets_and_keeps_legacy_sheets -v`

Expected: FAIL because `server.api.selected_targets` does not exist yet.

- [ ] **Step 3: Add API target extraction helper**

Add this helper near the API route utilities:

```python
def selected_targets(body):
    return body.get("printTargets") or body.get("sheets") or []
```

- [ ] **Step 4: Accept `printTargets` in routes**

Change `/api/preview-plan` and `/api/optimize` to read `selected_targets(body)`. Pass targets through preview, Excel optimization, and PDF export.

- [ ] **Step 5: Return range-aware previews**

Keep upload preview unchanged at the top level while allowing optimized previews and page previews to expose active ranges and new formula/merge metadata.

- [ ] **Step 6: Re-run backend tests**

Run: `python -m unittest server.tests.test_excel_engine -v`

Expected: PASS.

### Task 5: Mini Program Workflow State

**Files:**
- Modify: `tests/workflow.test.js`
- Modify: `miniprogram/utils/workflow.js`
- Modify: `miniprogram/pages/index/index.js`

- [ ] **Step 1: Write failing workflow tests**

Assert sessions create active print targets and expanded settings:

```javascript
test("demo workbook session keeps default print targets for selected sheets", () => {
  const session = createDemoWorkbookSession({ name: "sales.xlsx", size: 1024 });
  assert.equal(session.printTargets.length, 2);
  assert.equal(session.printTargets[0].rangeSource, "auto");
});

test("default settings include fit modes and free beautification flag", () => {
  assert.equal(printSettings.fitMode, "all-columns");
  assert.equal(printSettings.fitToWidth, 1);
  assert.equal(printSettings.fitToHeight, 0);
  assert.equal(printSettings.aiBeautify, true);
});
```

- [ ] **Step 2: Run failing workflow tests**

Run: `node --test tests/workflow.test.js`

Expected: FAIL because sessions and settings do not yet carry print targets or fitting modes.

- [ ] **Step 3: Extend session normalization**

Add a helper that maps backend Sheet metadata into targets with `autoRange`, `range`, and `rangeSource`. Store targets in backend-normalized sessions and demo sessions while retaining `selectedSheetIds` for older page code.

- [ ] **Step 4: Extend default settings**

Replace boolean-only width fitting with explicit `fitMode`, `fitToWidth`, `fitToHeight`, `aiBeautify`, centering, and margin preset defaults while retaining any fields still rendered by the existing settings page.

- [ ] **Step 5: Verify workflow tests**

Run: `node --test tests/workflow.test.js`

Expected: PASS.

### Task 6: Analyze-Step Range Selection

**Files:**
- Modify: `miniprogram/pages/analyze/analyze.js`
- Modify: `miniprogram/pages/analyze/analyze.wxml`
- Modify: `miniprogram/pages/analyze/analyze.wxss`
- Modify: `miniprogram/pages/compare/compare.js`

- [ ] **Step 1: Add state handlers for target editing**

Implement analyze-page handlers that update the current Sheet target range from input, reset it to `autoRange`, and block navigation when a selected Sheet has no target. Use a conservative A1 regex and uppercase normalized input:

```javascript
const RANGE_PATTERN = /^[A-Z]{1,3}[1-9]\d*:[A-Z]{1,3}[1-9]\d*$/;
```

- [ ] **Step 2: Render edit controls during analysis**

Show each selected Sheet's active range, formula warning count, and a compact manual range input with apply/reset actions. Preserve current preview cells and add merged-region status text where metadata exists.

- [ ] **Step 3: Add tap range selection on preview cells**

Expose the preview grid as a bounded first-pass range picker. Store the first tapped cell as a selection anchor and the second tapped cell as the opposite corner, derive the normalized A1 rectangle from the Sheet's preview range, and update the same active target range used by manual input:

```javascript
function rangeFromCells(first, second) {
  const minColumn = Math.min(first.column, second.column);
  const maxColumn = Math.max(first.column, second.column);
  const minRow = Math.min(first.row, second.row);
  const maxRow = Math.max(first.row, second.row);
  return `${columnLabel(minColumn)}${minRow}:${columnLabel(maxColumn)}${maxRow}`;
}
```

Style selected preview cells as a continuous rectangle and keep manual A1 editing for ranges outside the bounded preview grid.

- [ ] **Step 4: Preserve selected targets when Sheet choices change**

When checkbox selection changes, keep target edits for still-selected Sheets and omit targets for unchecked Sheets from downstream requests.

- [ ] **Step 5: Send targets into page preview**

Update compare page API payload from:

```javascript
{ workbookId: session.id, sheets: session.selectedSheetIds, plan }
```

to:

```javascript
{ workbookId: session.id, printTargets: session.printTargets.filter((target) => session.selectedSheetIds.includes(target.sheet)), plan }
```

- [ ] **Step 6: Manually inspect mini program template data paths**

Run: `rg -n "printTargets|selectedSheetIds|rangeSource|printRange|mergedCells|formulaWarnings" miniprogram/pages miniprogram/utils`

Expected: analyze and compare pages use print targets, legacy selection remains available where needed.

### Task 7: Expanded Settings and Optimize Payload

**Files:**
- Modify: `miniprogram/pages/settings/settings.js`
- Modify: `miniprogram/pages/settings/settings.wxml`
- Modify: `miniprogram/pages/settings/settings.wxss`

- [ ] **Step 1: Add print mode handler**

Create a `setFitMode` handler that maps the three UI controls to fit values:

```javascript
const FIT_MODES = {
  "one-page": { fitToWidth: 1, fitToHeight: 1 },
  "all-rows": { fitToWidth: 0, fitToHeight: 1 },
  "all-columns": { fitToWidth: 1, fitToHeight: 0 }
};
```

- [ ] **Step 2: Render the four function controls**

Add segmented or button controls for one-page, all-rows, all-columns, and AI beautification. Add compact toggles for repeat header, gridlines, centering, and orientation while keeping paper and margin affordances visible.

- [ ] **Step 3: Send print targets on optimize**

Update optimize request data so backend sessions send:

```javascript
{
  workbookId: session.id,
  printTargets: session.printTargets.filter((target) => session.selectedSheetIds.includes(target.sheet)),
  plan: { id: planId, ...this.data.settings }
}
```

- [ ] **Step 4: Verify settings data references**

Run: `rg -n "fitMode|fitToHeight|aiBeautify|printTargets|horizontalCentered|verticalCentered" miniprogram/pages/settings miniprogram/utils`

Expected: new settings fields are wired from defaults through optimize payload.

### Task 8: Browser Preview Parity

**Files:**
- Modify: `preview/index.html`
- Modify: `tests/preview.test.js`

- [ ] **Step 1: Read and preserve existing local diff**

Run: `git diff -- preview/index.html tests/preview.test.js`

Expected: understand any pre-existing browser preview and test edits before applying this task.

- [ ] **Step 2: Write or extend preview test**

Assert the inline browser MVP includes range target UI anchors and fitting controls without relying on visual styling:

```javascript
assert.match(html, /printTargets/);
assert.match(html, /data-fit="one-page"/);
assert.match(html, /data-fit="all-rows"/);
assert.match(html, /data-fit="all-columns"/);
```

- [ ] **Step 3: Run failing preview test**

Run: `node --test tests/preview.test.js`

Expected: FAIL until browser state and controls exist.

- [ ] **Step 4: Add browser parity**

Keep selected targets in browser state, render active ranges and formula/merge warnings in Sheet list or preview panels, send `printTargets` to preview and optimize routes, and add the four print function controls.

- [ ] **Step 5: Verify preview test**

Run: `node --test tests/preview.test.js`

Expected: PASS.

### Task 9: End-to-End Verification

**Files:**
- Verify: `server/tests/test_excel_engine.py`
- Verify: `tests/workflow.test.js`
- Verify: `tests/preview.test.js`

- [ ] **Step 1: Run full automated checks**

Run:

```powershell
python -m unittest server.tests.test_excel_engine -v
node --test tests/workflow.test.js
node --test tests/preview.test.js
```

Expected: all tests pass.

- [ ] **Step 2: Start local browser demo**

Run: `python -m server.api`

Expected: terminal prints the local demo URL on an available port.

- [ ] **Step 3: Verify browser MVP**

Open the local preview in the Codex in-app browser and verify:

- Range controls appear after upload data is available.
- Print fitting controls update preview/optimize payloads.
- Formula warning text is visible when a formula result is unavailable.
- Merged-cell metadata is surfaced rather than silently flattened.

- [ ] **Step 4: Record remaining limitations**

In the final response, state that arbitrary formula calculation still depends on cached Excel/WPS results and note that the first range picker supports bounded preview-cell tap selection plus manual A1 ranges before full large-grid drag virtualization.
