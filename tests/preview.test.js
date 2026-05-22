const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

const previewPath = path.join(__dirname, "..", "preview", "index.html");

test("browser preview has resolved markup and executable inline script", () => {
  const html = fs.readFileSync(previewPath, "utf8");

  assert.doesNotMatch(html, /^(<<<<<<<|=======|>>>>>>>)/m);

  const script = html.split("<script>")[1]?.split("</script>")[0];
  assert.ok(script, "preview inline script should exist");
  new vm.Script(script);
});

function createFakeElement(id = "") {
  return {
    id,
    textContent: "",
    innerHTML: "",
    className: "",
    value: "",
    checked: false,
    dataset: {},
    style: {},
    scrollHeight: 800,
    clientWidth: 1200,
    clientHeight: 900,
    classList: {
      add() {},
      remove() {},
      toggle() {},
    },
    addEventListener() {},
    appendChild() {},
    remove() {},
    click() {},
    querySelector() {
      return createFakeElement();
    },
    querySelectorAll() {
      return [];
    },
    closest() {
      return null;
    },
  };
}

function loadPreviewExports() {
  const html = fs.readFileSync(previewPath, "utf8");
  const script = html.split("<script>")[1]?.split("</script>")[0];
  assert.ok(script, "preview inline script should exist");

  const elements = new Map();
  const getElement = (id) => {
    if (!elements.has(id)) elements.set(id, createFakeElement(id));
    return elements.get(id);
  };

  const document = {
    body: createFakeElement("body"),
    createElement(tag) {
      return createFakeElement(tag);
    },
    getElementById(id) {
      return getElement(id);
    },
    querySelectorAll() {
      return [];
    },
    addEventListener() {},
  };
  document.body.appendChild = () => {};

  const sandbox = {
    console,
    URL,
    window: {
      location: {
        origin: "http://127.0.0.1:4173",
        protocol: "http:",
      },
      addEventListener() {},
    },
    location: {
      origin: "http://127.0.0.1:4173",
      protocol: "http:",
    },
    document,
    fetch: async () => {
      throw new Error("fetch should not be called in preview unit tests");
    },
    FormData: class {
      append() {}
    },
    AbortController: class {
      constructor() {
        this.signal = {};
      }
      abort() {}
    },
    setTimeout,
    clearTimeout,
    requestAnimationFrame(fn) {
      return 1;
    },
    cancelAnimationFrame() {},
    HTMLSelectElement: class {},
    HTMLInputElement: class {},
    navigator: { userAgent: "node-test" },
  };
  sandbox.window.document = document;
  sandbox.window.setTimeout = setTimeout;
  sandbox.window.clearTimeout = clearTimeout;
  sandbox.window.requestAnimationFrame = sandbox.requestAnimationFrame;
  sandbox.window.cancelAnimationFrame = sandbox.cancelAnimationFrame;
  sandbox.window.navigator = sandbox.navigator;
  sandbox.globalThis = sandbox;

  const instrumented = `${script.replace(/\brenderAll\(\);\s*$/, "")}
globalThis.__previewTestExports = {
  state,
  DEFAULT_PRINT_SETTINGS,
  sheetSettings,
  syncUiSettingsFromSheet,
  commitUiSettingsToSheet,
  selectedTargets,
  applyPlan,
  previewOrientation
};`;

  vm.createContext(sandbox);
  new vm.Script(instrumented).runInContext(sandbox);
  return sandbox.__previewTestExports;
}

test("sheet print settings stay isolated per selected sheet", () => {
  const preview = loadPreviewExports();
  const { state, syncUiSettingsFromSheet, applyPlan, selectedTargets, previewOrientation } = preview;

  state.sheets = [
    {
      name: "申报表202511月",
      checked: true,
      printRange: "A1:AN55",
      rangeSource: "auto",
      recommendedOrientation: "portrait",
    },
    {
      name: "收入、税金分割表",
      checked: true,
      printRange: "A1:N23",
      rangeSource: "manual",
      recommendedOrientation: "landscape",
    },
  ];
  state.activeSheetName = "申报表202511月";
  state.previewUi.settingsSheetName = "申报表202511月";
  state.sheetSettingsByName = {};
  state.preview = {
    sheets: [
      { name: "申报表202511月", pages: [] },
      { name: "收入、税金分割表", pages: [] },
    ],
  };

  applyPlan({
    id: "portrait-plan",
    orientation: "portrait",
    fitMode: "singlePage",
    fitToWidth: 1,
    fitToHeight: 1,
    beautify: true,
  }, "申报表202511月");

  applyPlan({
    id: "landscape-plan",
    orientation: "landscape",
    fitMode: "fitColumns",
    fitToWidth: 1,
    fitToHeight: 0,
    beautify: false,
  }, "收入、税金分割表");

  syncUiSettingsFromSheet("申报表202511月");
  assert.equal(state.settings.orientation, "portrait");
  assert.equal(state.settings.fitMode, "singlePage");

  syncUiSettingsFromSheet("收入、税金分割表");
  assert.equal(state.settings.orientation, "landscape");
  assert.equal(state.settings.fitMode, "fitColumns");

  const targets = selectedTargets();
  assert.equal(targets.length, 2);
  assert.deepEqual(
    targets.map((target) => ({
      sheet: target.sheet,
      orientation: target.plan.orientation,
      fitMode: target.plan.fitMode,
    })),
    [
      { sheet: "申报表202511月", orientation: "portrait", fitMode: "singlePage" },
      { sheet: "收入、税金分割表", orientation: "landscape", fitMode: "fitColumns" },
    ],
  );

  state.previewUi.settingsSheetName = "收入、税金分割表";
  assert.equal(previewOrientation("settings"), "landscape");
  state.previewUi.settingsSheetName = "申报表202511月";
  assert.equal(previewOrientation("settings"), "portrait");
});
