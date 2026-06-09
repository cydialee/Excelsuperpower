const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

const previewPath = path.join(__dirname, "..", "preview", "index.html");

function extractScript() {
  const html = fs.readFileSync(previewPath, "utf8");
  const script = html.split("<script>")[1]?.split("</script>")[0];
  assert.ok(script, "preview inline script should exist");
  return { html, script };
}

function createFakeElement(id = "") {
  return {
    id,
    textContent: "",
    innerHTML: "",
    className: "",
    value: "",
    checked: false,
    dataset: {},
    style: { width: "" },
    files: [],
    classList: {
      add() {},
      remove() {},
      toggle() {},
      contains() { return false; }
    },
    addEventListener() {},
    appendChild() {},
    remove() {},
    click() {},
    scrollIntoView() {},
    focus() {},
    querySelector() { return createFakeElement(); },
    querySelectorAll() { return []; },
    closest() { return null; }
  };
}

function loadPreviewApp(fetchImpl = async () => ({ ok: true, json: async () => ({ ok: true }) })) {
  const { html, script } = extractScript();
  const ids = [...html.matchAll(/id="([^"]+)"/g)].map((match) => match[1]);
  const elements = new Map(ids.map((id) => [id, createFakeElement(id)]));

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
    querySelector() {
      return createFakeElement("query");
    },
    querySelectorAll() {
      return [];
    },
    addEventListener() {}
  };

  const sandbox = {
    console,
    document,
    window: null,
    location: { origin: "http://127.0.0.1:4173" },
    navigator: { userAgent: "node-test", clipboard: { writeText: async () => {} } },
    fetch: fetchImpl,
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
    URL,
  };

  sandbox.window = sandbox;
  sandbox.window.addEventListener = () => {};
  sandbox.globalThis = sandbox;

  vm.createContext(sandbox);
  new vm.Script(script).runInContext(sandbox);
  return sandbox.__previewApp;
}

test("browser preview inline script compiles", () => {
  const { script } = extractScript();
  assert.doesNotThrow(() => new vm.Script(script));
});

test("browser preview boot script can run in a fake DOM", () => {
  assert.doesNotThrow(() => {
    loadPreviewApp();
  });
});

test("selectedTargets keep per-sheet ranges and plans isolated", () => {
  const app = loadPreviewApp();
  const sales = app.createSheetState({
    name: "Sales",
    rows: 45,
    columns: 6,
    autoRange: "A1:F45",
    printRange: "A1:F45",
    rangeSource: "auto",
    recommendedOrientation: "portrait"
  }, 0);
  const notes = app.createSheetState({
    name: "Notes",
    rows: 8,
    columns: 12,
    autoRange: "A1:L8",
    printRange: "A1:L8",
    rangeSource: "auto",
    recommendedOrientation: "landscape"
  }, 1);

  app.state.sheets = [sales, notes];
  app.state.activeSheetName = "Sales";
  app.applyPlanToSheet("Sales", { orientation: "portrait", fitMode: "singlePage" });
  app.applyPlanToSheet("Notes", { orientation: "landscape", fitMode: "fitColumns" });
  app.state.sheets[0].printRange = "A1:D20";
  app.state.sheets[0].rangeSource = "manual";
  app.state.sheets[1].printRange = "B2:H7";
  app.state.sheets[1].rangeSource = "batch";

  const targets = app.selectedTargets();
  assert.equal(targets.length, 2);
  assert.deepEqual(
    targets.map((item) => ({
      sheet: item.sheet,
      range: item.range,
      rangeSource: item.rangeSource,
      orientation: item.plan.orientation,
      fitMode: item.plan.fitMode
    })),
    [
      {
        sheet: "Sales",
        range: "A1:D20",
        rangeSource: "manual",
        orientation: "portrait",
        fitMode: "singlePage"
      },
      {
        sheet: "Notes",
        range: "B2:H7",
        rangeSource: "batch",
        orientation: "landscape",
        fitMode: "fitColumns"
      }
    ]
  );
});

test("range parser and formatter round-trip A1 ranges", () => {
  const app = loadPreviewApp();
  const bounds = app.parseA1Range("B2:F18");
  assert.deepEqual({ ...bounds }, {
    startRow: 2,
    endRow: 18,
    startCol: 2,
    endCol: 6
  });
  assert.equal(app.formatA1Range(bounds), "B2:F18");
});
