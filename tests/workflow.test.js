const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createAnalysisSnapshot,
  createDemoPrintJob,
  createDemoWorkbookSession,
  getComparisonSlides,
  getPromoSlides,
  getPlanById,
  getRecentFiles,
  getSelectedSheets,
  printSettings
} = require("../miniprogram/utils/workflow");

test("analysis snapshot exposes print risks and a score for selected sheets", () => {
  const snapshot = createAnalysisSnapshot(["sales", "finance"]);

  assert.equal(snapshot.score, 72);
  assert.equal(snapshot.opportunities.length, 4);
  assert.match(snapshot.summary, /2 个 Sheet/);
});

test("plan lookup returns the recommended horizontal plan", () => {
  const plan = getPlanById("horizontal");

  assert.equal(plan.name, "方案 A");
  assert.equal(plan.recommended, true);
  assert.equal(plan.paperUse, "92%");
});

test("selected sheet helper ignores unknown identifiers", () => {
  const selected = getSelectedSheets(["sales", "missing", "inventory"]);

  assert.deepEqual(
    selected.map((sheet) => sheet.id),
    ["sales", "inventory"]
  );
});

test("recent files and default print settings are ready for UI mock data", () => {
  assert.equal(getRecentFiles().length, 3);
  assert.equal(printSettings.orientation, "landscape");
  assert.equal(printSettings.repeatHeader, true);
});

test("home promo slides describe the rotating optimization capabilities", () => {
  const slides = getPromoSlides();

  assert.equal(slides.length, 3);
  assert.deepEqual(
    slides.map((slide) => slide.id),
    ["layout", "sheets", "batch"]
  );
});

test("comparison slides cover the print outcomes shown after optimization", () => {
  const slides = getComparisonSlides();

  assert.equal(slides.length, 3);
  assert.equal(slides[0].beforePages, 8);
  assert.equal(slides[0].afterPages, 4);
  assert.match(slides[1].title, /表头/);
});

test("uploaded excel metadata becomes an executable demo workbook session", () => {
  const session = createDemoWorkbookSession({
    name: "sales.xlsx",
    path: "wxfile://tmp_sales",
    size: 1024 * 500
  });

  assert.equal(session.filename, "sales.xlsx");
  assert.equal(session.sheets.length, 3);
  assert.equal(session.selectedSheetIds.length, 2);
});

test("demo print job captures selected sheets plan and settings", () => {
  const session = createDemoWorkbookSession({
    name: "sales.xlsx",
    path: "wxfile://tmp_sales",
    size: 1024 * 500
  });
  const job = createDemoPrintJob(session, "horizontal", printSettings);

  assert.equal(job.status, "ready");
  assert.equal(job.plan.id, "horizontal");
  assert.equal(job.outputs.length, 2);
  assert.equal(job.selectedSheets.length, 2);
});
