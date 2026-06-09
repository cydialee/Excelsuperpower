const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildPrintTargets,
  createAnalysisSnapshot,
  createDemoPrintJob,
  createDemoWorkbookSession,
  formatFitModeLabel,
  getComparisonSlides,
  getPromoSlides,
  getPlanById,
  getRecentFiles,
  getSelectedSheets,
  printSettings,
  resolveClientPlan
} = require("../miniprogram/utils/workflow");

test("analysis snapshot exposes print risks and a score for selected sheets", () => {
  const snapshot = createAnalysisSnapshot(["sales", "finance"]);

  assert.equal(snapshot.opportunities.length, 4);
  assert.match(snapshot.summary, /2 个 Sheet/);
  assert.ok(snapshot.score >= 62);
});

test("plan lookup returns the recommended fit-columns plan", () => {
  const plan = getPlanById("fit-columns");

  assert.equal(plan.name, "方案 A");
  assert.equal(plan.recommended, true);
  assert.equal(plan.fitMode, "fitColumns");
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

test("home promo slides describe rotating optimization capabilities", () => {
  const slides = getPromoSlides();

  assert.equal(slides.length, 3);
  assert.deepEqual(
    slides.map((slide) => slide.id),
    ["layout", "sheets", "batch"]
  );
});

test("comparison slides cover core print outcomes", () => {
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
  assert.equal(session.sheets[0].printRange, "A1:I36");
});

test("resolved client plan keeps fit-mode semantics intact", () => {
  const plan = resolveClientPlan("fit-rows", { paper: "A3" });

  assert.equal(plan.fitMode, "fitRows");
  assert.equal(plan.fitToWidth, 0);
  assert.equal(plan.fitToHeight, 1);
  assert.equal(plan.paper, "A3");
});

test("build print targets carries range and per-sheet plan information", () => {
  const session = createDemoWorkbookSession({
    name: "sales.xlsx",
    path: "wxfile://tmp_sales",
    size: 1024 * 500
  });
  session.sheets[0].printRange = "B2:H20";
  session.sheets[0].rangeSource = "manual";

  const targets = buildPrintTargets(session, { fitMode: "singlePage" }, "single-page");

  assert.equal(targets.length, 2);
  assert.equal(targets[0].range, "B2:H20");
  assert.equal(targets[0].rangeSource, "manual");
  assert.equal(targets[0].plan.fitMode, "singlePage");
});

test("demo print job captures selected sheets plan settings and preview", () => {
  const session = createDemoWorkbookSession({
    name: "sales.xlsx",
    path: "wxfile://tmp_sales",
    size: 1024 * 500
  });
  const job = createDemoPrintJob(session, "fit-columns", printSettings);

  assert.equal(job.status, "ready");
  assert.equal(job.plan.id, "fit-columns");
  assert.equal(job.outputs.length, 2);
  assert.equal(job.selectedSheets.length, 2);
  assert.ok(job.preview.optimizedPageCount >= 1);
});

test("fit-mode labels are human readable", () => {
  assert.equal(formatFitModeLabel("fitColumns"), "按列适配");
  assert.equal(formatFitModeLabel("fitRows"), "按行适配");
  assert.equal(formatFitModeLabel("singlePage"), "整表单页");
});
