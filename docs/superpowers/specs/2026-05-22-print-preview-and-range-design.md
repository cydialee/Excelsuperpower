# Print Preview, Range Selection, and Print Controls Design

## Goal

Improve the Excel print workflow so users can trust the upload preview, choose
the exact area they want to print before plan recommendation, and access a
useful set of print controls including a free baseline AI beautification mode.

## Confirmed Product Decisions

- Preview formula cells with their calculated values rather than raw formulas.
- Preserve merged-cell structure in previews and print-area selection.
- Add print-area selection immediately after upload parsing and Sheet selection.
- Base plan recommendation, page preview, optimized Excel output, and PDF output
  on each selected Sheet's chosen print range.
- Expand the primary print function area with:
  - Fit full table to one page.
  - Fit all rows to one page.
  - Fit all columns to one page.
  - AI optimize and beautify.
- Ship AI optimize and beautify as a usable free baseline first. Reserve stronger
  AI and advanced beautification capabilities for a later paid tier.

## User Flow

1. User uploads an `.xlsx` or `.xlsm` workbook.
2. Backend parses visible Sheets, used ranges, preview cells, formulas with
   available cached values, and merged-cell metadata.
3. Analyze page shows selectable Sheets. Each selected Sheet starts with its
   auto-detected used range as the default print range.
4. User opens a Sheet range picker to inspect its preview and select a narrower
   rectangular print area.
5. User confirms the selected ranges.
6. Plan recommendation and preview pages calculate against those ranges.
7. Print settings page exposes the expanded print modes and baseline AI
   beautification option.
8. Optimize output writes the chosen print ranges into the workbook and exports
   only the selected ranges for PDF preview/output.

## Range Selection Experience

### Default State

Each selected Sheet carries:

- `autoRange`: the used range detected from non-empty cells.
- `printRange`: the active range used by downstream work.
- `rangeSource`: `auto` until the user edits the selection.

The analyze page displays the Sheet name, dimensions, selected range, and a
clear edit entrypoint. Users do not need to select a range manually for ordinary
files.

### Range Picker

The range picker is a focused Sheet preview opened from the analyze step.

- Render row and column headers around the preview grid.
- Support drag/tap selection of one rectangular range on mobile.
- Show the selected A1 range label while the user adjusts it.
- Keep a manual A1 input for precise ranges such as `B3:H42`.
- Provide reset-to-auto action.
- Validate that the selected range belongs to the current Sheet and intersects
  the parsed preview bounds before confirmation.

For large tables, the first implementation should avoid pretending to render the
entire workbook. It may show a scrollable bounded grid for the used range, with
server-provided cells for that range and lightweight row/column labels. Later
virtualization can be added if very large Sheet previews become a bottleneck.

### Merged Cells During Selection

Merged cells must be represented as merged regions instead of duplicated blank
cells or flattened ordinary cells.

- Backend returns merge bounds for previewable merged regions.
- Frontend renders merged blocks with row span and column span semantics in the
  range picker and page preview.
- If a user's rectangle cuts through a merged block, the first implementation
  expands the range to include the full merged region and explains the adjusted
  range in the selection UI.

## Preview Data Strategy

### Formula Values

Workbook preview and page preview should prefer calculated values.

- Load formula metadata where needed to know that a cell is formula-backed.
- Load cached workbook values for displayed values when cached results exist.
- Return a preview status for formula cells with no usable cached value.
- UI displays a short warning for unavailable calculated results and asks users
  to recalculate and save in Excel or WPS before upload if result accuracy is
  required.

The backend must not silently evaluate arbitrary Excel formulas itself in this
phase. `openpyxl` can read cached results but is not a formula calculation
engine.

### Preview Contract

Preview responses should carry enough structure for the frontend to render the
selected range accurately:

- Sheet name and active range.
- Cell matrix for displayed values.
- Formula-result warnings where needed.
- Merged-cell regions within the returned range.
- Page simulation data computed from the active range.

## Print Controls

### Primary Modes

The print setting model should separate the page fitting intent from cosmetic
beautification:

| User Control | Fit Width | Fit Height | Intended Use |
| --- | --- | --- | --- |
| Fit full table to one page | 1 | 1 | Small tables that must stay on one sheet |
| Fit all rows to one page | 0 | 1 | Long narrow tables where vertical fit matters |
| Fit all columns to one page | 1 | 0 | Wide tables where width fit matters |

`0` means unconstrained in the workbook output model where the Excel writer
supports that meaning. The preview simulator should mirror the chosen intent
instead of treating every option as width-only fitting.

### Additional Adjustable Settings

The expanded settings design should allow room for:

- Paper size such as A4 and A3.
- Orientation.
- Margin preset and later explicit top/bottom/left/right margins.
- Repeat header row toggle.
- Gridline toggle for print output.
- Horizontal/vertical centering toggles.
- Header beautification toggle where not controlled by AI beautification.

The implementation can stage these controls, but the settings model should avoid
locking the product into only the current three toggles.

## Free Baseline AI Beautification

The first usable free mode should be deterministic and safe:

- Emphasize detected header rows.
- Improve baseline font consistency and alignment.
- Apply restrained header fill and readable contrast.
- Add or preserve practical borders for printed tables.
- Apply alternating row color only when it improves scanability.
- Add column-width fallback for columns without usable widths.
- Avoid destructive data edits and avoid changing workbook meaning.

The later paid layer can add stronger analysis and transformations:

- Data-aware layout adjustment.
- Advanced typography and print density strategy.
- Data-region recognition and merge suggestions.
- Rich row/column color strategies.
- More expensive AI-assisted style recommendations and explainability.

The UI should label the current action as usable, not as a disabled premium
teaser. Paid feature hooks can be represented in the model and analytics later
without blocking the free baseline.

## Backend Model Changes

Selected Sheet requests should move from a plain Sheet-name list toward a
per-Sheet print target:

```json
{
  "sheet": "Sales",
  "range": "B3:H42",
  "rangeSource": "manual"
}
```

For compatibility, API handlers may temporarily accept the existing `sheets`
list and derive ranges from used ranges when print targets are absent.

Core print engine operations should accept range bounds explicitly:

- Analyze range dimensions and merge regions.
- Simulate pages for the chosen range.
- Apply `print_area` for the chosen range.
- Export PDF data from the chosen range.

## Error Handling

- Invalid A1 range: keep user in the picker and explain the accepted format.
- Range outside a Sheet's detected bounds: reject or clamp only when the UI
  makes the correction explicit.
- Range intersects merged cells partially: expand to full merge region and show
  the adjusted selection.
- Formula result missing: show warning, preserve workbook output, and avoid
  claiming the preview value is calculated.
- No selected Sheet/range: block recommendation and output with a clear prompt.

## Testing Strategy

- Backend tests cover cached formula result preview behavior and missing-result
  status handling.
- Backend tests cover merged-cell metadata in workbook preview and page preview.
- Backend tests cover print range propagation into preview, `print_area`, and PDF
  source data.
- Backend tests cover fit-width and fit-height combinations for the three fit
  modes.
- Frontend workflow tests cover selected print targets and settings payloads.
- Manual mini program verification covers range selection gestures, merged-cell
  display, preview text wrapping, and output flow.

## Implementation Order

1. Extend backend tests and range-aware engine helpers.
2. Add formula-value and merged-region preview data.
3. Add per-Sheet print targets to API requests and outputs.
4. Build analyze-step range picker and range validation.
5. Expand settings controls and fitting semantics.
6. Implement free baseline AI beautification rules.
7. Verify mini program and browser preview flows against representative files.
