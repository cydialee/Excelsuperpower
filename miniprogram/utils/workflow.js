const RANGE_PATTERN = /^\$?[A-Za-z]{1,3}\$?\d+(?::\$?[A-Za-z]{1,3}\$?\d+)?$/;

const PLAN_LIBRARY = [
  {
    id: "fit-columns",
    name: "方案 A",
    title: "按列适配",
    description: "适合宽表，将所有列控制在一页宽度内，纵向按内容自然分页。",
    orientation: "landscape",
    fitMode: "fitColumns",
    fitToWidth: 1,
    fitToHeight: 0,
    repeatHeader: true,
    freezeTopRow: true,
    margin: "normal",
    beautify: true,
    showGridLines: false,
    wrapLongText: false,
    wrapTextColumns: "",
    paperUse: "92%",
    saving: "18%",
    pages: "减少 4 页",
    recommended: true,
    score: 5
  },
  {
    id: "single-page",
    name: "方案 B",
    title: "整表单页",
    description: "适合小型汇总表或汇报页，让整张表压缩到一页中便于归档。",
    orientation: "portrait",
    fitMode: "singlePage",
    fitToWidth: 1,
    fitToHeight: 1,
    repeatHeader: true,
    freezeTopRow: true,
    margin: "normal",
    beautify: true,
    showGridLines: false,
    wrapLongText: false,
    wrapTextColumns: "",
    paperUse: "84%",
    saving: "12%",
    pages: "单页输出",
    recommended: false,
    score: 4
  },
  {
    id: "fit-rows",
    name: "方案 C",
    title: "按行适配",
    description: "适合窄列长表，优先压缩纵向高度，减少跨页时的阅读割裂。",
    orientation: "portrait",
    fitMode: "fitRows",
    fitToWidth: 0,
    fitToHeight: 1,
    repeatHeader: true,
    freezeTopRow: true,
    margin: "normal",
    beautify: true,
    showGridLines: false,
    wrapLongText: false,
    wrapTextColumns: "",
    paperUse: "88%",
    saving: "10%",
    pages: "减少纵向翻页",
    recommended: false,
    score: 4
  },
  {
    id: "compact",
    name: "方案 D",
    title: "紧凑归档",
    description: "适合批量归档或节纸场景，通过更紧凑的边距和版式提升纸张利用率。",
    orientation: "landscape",
    fitMode: "fitColumns",
    fitToWidth: 1,
    fitToHeight: 0,
    repeatHeader: true,
    freezeTopRow: true,
    margin: "compact",
    beautify: true,
    showGridLines: false,
    wrapLongText: false,
    wrapTextColumns: "",
    paperUse: "95%",
    saving: "22%",
    pages: "最省纸张",
    recommended: false,
    score: 4
  },
  {
    id: "manual",
    name: "方案 E",
    title: "手动控制",
    description: "保留更多打印原貌，适合对页边距、网格线和样式有明确要求的文件。",
    orientation: "landscape",
    fitMode: "fitColumns",
    fitToWidth: 1,
    fitToHeight: 0,
    repeatHeader: false,
    freezeTopRow: false,
    margin: "normal",
    beautify: false,
    showGridLines: true,
    wrapLongText: false,
    wrapTextColumns: "",
    paperUse: "80%",
    saving: "0%",
    pages: "保留原设置",
    recommended: false,
    score: 3
  }
];

const DEFAULT_PRINT_SETTINGS = {
  paper: "A4",
  orientation: "landscape",
  fitMode: "fitColumns",
  fitToWidth: 1,
  fitToHeight: 0,
  top: 12,
  bottom: 12,
  left: 10,
  right: 10,
  marginPreset: "normal",
  margin: "normal",
  repeatHeader: true,
  freezeTopRow: true,
  beautify: true,
  showGridLines: false,
  centerHorizontally: true,
  centerVertically: false,
  wrapLongText: false,
  wrapTextColumns: ""
};

const SHEET_LIBRARY = [
  {
    id: "sales",
    name: "销售数据分析_2024.xlsx",
    shortName: "销售总表",
    rows: 240,
    columns: 18,
    autoRange: "A1:R240",
    printRange: "A1:R240",
    rangeSource: "auto",
    recommendedOrientation: "landscape",
    status: "建议已生成"
  },
  {
    id: "finance",
    name: "财务报表_季度汇总.xlsx",
    shortName: "财务汇总",
    rows: 84,
    columns: 12,
    autoRange: "A1:L84",
    printRange: "A1:L84",
    rangeSource: "excel",
    recommendedOrientation: "portrait",
    status: "沿用 Excel 打印区域"
  },
  {
    id: "inventory",
    name: "库存明细_5月.xlsx",
    shortName: "库存明细",
    rows: 168,
    columns: 22,
    autoRange: "A1:V168",
    printRange: "B1:P118",
    rangeSource: "manual",
    recommendedOrientation: "landscape",
    status: "已人工缩小打印范围"
  }
];

const PROMO_SLIDES = [
  {
    id: "layout",
    title: "按 Excel 语义推荐打印方案",
    subtitle: "先识别 Sheet、打印区域和表头，再推荐更可信的分页方式。",
    tone: "layout"
  },
  {
    id: "sheets",
    title: "逐个 Sheet 调整打印范围",
    subtitle: "支持保留 Excel 原打印区域，也能手动改成更精确的 A1 选区。",
    tone: "sheets"
  },
  {
    id: "batch",
    title: "批量任务保留独立设置",
    subtitle: "同一个任务里，不同 Sheet 也能各自选择适配方式和范围。",
    tone: "batch"
  }
];

const COMPARISON_SLIDES = [
  {
    id: "pages",
    title: "分页结构",
    beforePages: 8,
    afterPages: 4,
    paperUse: "92%",
    saving: "18%"
  },
  {
    id: "header",
    title: "重复表头",
    beforePages: 6,
    afterPages: 4,
    paperUse: "88%",
    saving: "12%"
  },
  {
    id: "width",
    title: "宽表方向",
    beforePages: 10,
    afterPages: 5,
    paperUse: "95%",
    saving: "22%"
  }
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeFitMode(config) {
  const next = { ...config };

  if (next.fitMode === "singlePage") {
    next.fitToWidth = 1;
    next.fitToHeight = 1;
  } else if (next.fitMode === "fitRows") {
    next.fitToWidth = 0;
    next.fitToHeight = 1;
  } else {
    next.fitMode = "fitColumns";
    next.fitToWidth = 1;
    next.fitToHeight = 0;
  }

  return next;
}

function getPlanById(id) {
  return clone(PLAN_LIBRARY.find((plan) => plan.id === id) || PLAN_LIBRARY[0]);
}

function getDefaultPrintSettings() {
  return clone(DEFAULT_PRINT_SETTINGS);
}

function resolveClientPlan(planOrId, overrides = {}) {
  const seed =
    typeof planOrId === "string"
      ? getPlanById(planOrId)
      : getPlanById(planOrId && planOrId.id ? planOrId.id : PLAN_LIBRARY[0].id);
  const planDetails =
    planOrId && typeof planOrId === "object" && !Array.isArray(planOrId) ? planOrId : {};

  const merged = normalizeFitMode({
    ...DEFAULT_PRINT_SETTINGS,
    ...seed,
    ...planDetails,
    ...overrides
  });

  merged.marginPreset = merged.marginPreset || merged.margin || "normal";
  merged.margin = merged.marginPreset;
  merged.showGridLines = Boolean(merged.showGridLines);
  merged.repeatHeader = Boolean(merged.repeatHeader);
  merged.freezeTopRow = Boolean(merged.freezeTopRow);
  merged.beautify = Boolean(merged.beautify);
  merged.wrapLongText = Boolean(merged.wrapLongText);

  return merged;
}

function isValidRange(range) {
  return RANGE_PATTERN.test(String(range || "").trim());
}

function formatFitModeLabel(mode) {
  if (mode === "singlePage") return "整表单页";
  if (mode === "fitRows") return "按行适配";
  return "按列适配";
}

function formatRangeSourceLabel(source) {
  if (source === "excel") return "沿用 Excel";
  if (source === "manual") return "人工调整";
  return "自动识别";
}

function normalizeSheet(sheet, index) {
  const autoRange = sheet.autoRange || sheet.range || sheet.printRange || "A1:A1";
  const printRange = sheet.printRange || sheet.nativePrintArea || autoRange;
  const rangeSource =
    sheet.rangeSource ||
    (sheet.nativePrintArea ? "excel" : printRange === autoRange ? "auto" : "manual");

  return {
    ...sheet,
    id: sheet.id || sheet.name || `sheet-${index}`,
    name: sheet.name || `Sheet ${index + 1}`,
    shortName: sheet.shortName || sheet.name || `Sheet ${index + 1}`,
    rows: Number(sheet.rows || 0),
    columns: Number(sheet.columns || 0),
    autoRange,
    printRange,
    rangeSource,
    preview: sheet.preview || [],
    checked: Boolean(sheet.checked),
    plan: sheet.plan ? resolveClientPlan(sheet.plan) : null
  };
}

function normalizeSession(session) {
  const sheets = (session.sheets || []).map(normalizeSheet);
  const selectedIds = new Set(
    (session.selectedSheetIds && session.selectedSheetIds.length
      ? session.selectedSheetIds
      : sheets.map((sheet) => sheet.id)
    ).filter(Boolean)
  );

  return {
    ...session,
    plans: session.plans && session.plans.length ? session.plans.map((plan) => resolveClientPlan(plan)) : clone(PLAN_LIBRARY),
    sheets: sheets.map((sheet) => ({
      ...sheet,
      checked: selectedIds.has(sheet.id)
    })),
    selectedSheetIds: sheets
      .filter((sheet) => selectedIds.has(sheet.id))
      .map((sheet) => sheet.id)
  };
}

function createBackendWorkbookSession(payload) {
  return normalizeSession({
    id: payload.workbookId,
    filename: payload.filename,
    mode: "backend",
    plans: payload.plans || PLAN_LIBRARY,
    sheets: (payload.sheets || []).map((sheet) => ({
      ...sheet,
      id: sheet.name,
      checked: true
    })),
    selectedSheetIds: (payload.sheets || []).map((sheet) => sheet.name)
  });
}

function getRecentFiles() {
  return SHEET_LIBRARY.map((sheet, index) => ({
    ...clone(sheet),
    updatedAt: ["今天 14:30", "昨天 09:12", "05-14 16:20"][index]
  }));
}

function getPromoSlides() {
  return clone(PROMO_SLIDES);
}

function getComparisonSlides() {
  return clone(COMPARISON_SLIDES);
}

function getSelectedSheets(ids, sourceSheets = SHEET_LIBRARY) {
  const library = (sourceSheets || []).map(normalizeSheet);
  return (ids || [])
    .map((id) => library.find((sheet) => sheet.id === id || sheet.name === id))
    .filter(Boolean);
}

function countManualRanges(selected) {
  return selected.filter((sheet) => sheet.rangeSource === "manual").length;
}

function countWideSheets(selected) {
  return selected.filter((sheet) => sheet.columns >= 10).length;
}

function createAnalysisSnapshot(selectedIds, sourceSheets = SHEET_LIBRARY) {
  const selected = getSelectedSheets(selectedIds, sourceSheets);
  const sheetCount = selected.length || 1;
  const manualCount = countManualRanges(selected);
  const wideCount = countWideSheets(selected);
  const score = Math.max(62, 90 - manualCount * 6 - wideCount * 4);

  return {
    score,
    selected,
    summary: `已为 ${sheetCount} 个 Sheet 识别打印风险，并同步每个 Sheet 的有效打印区域。`,
    opportunities: [
      { id: "range", label: "打印区域", count: `${manualCount || 1} 处需确认` },
      { id: "columns", label: "宽表方向", count: `${wideCount || 1} 个待优化` },
      { id: "header", label: "重复表头", count: `${sheetCount} 个建议开启` },
      { id: "batch", label: "批量统一性", count: `${sheetCount} 个可独立设置` }
    ],
    metrics: [
      { label: "已选 Sheet", value: `${sheetCount} 个` },
      { label: "人工选区", value: `${manualCount} 个` },
      { label: "预计节省纸张", value: `${Math.max(2, sheetCount * 2)} 页` }
    ]
  };
}

function createDemoSheets(filename, isCsv) {
  if (isCsv) {
    return [
      {
        id: "csv_data",
        name: "CSV 数据",
        shortName: "CSV 数据",
        rows: 180,
        columns: 12,
        autoRange: "A1:L180",
        printRange: "A1:L180",
        rangeSource: "auto",
        checked: true
      }
    ];
  }

  return [
    {
      id: "sheet_summary",
      name: "汇总表",
      shortName: "汇总表",
      rows: 36,
      columns: 9,
      autoRange: "A1:I36",
      printRange: "A1:I36",
      rangeSource: "auto",
      checked: true
    },
    {
      id: "sheet_detail",
      name: "明细数据",
      shortName: "明细数据",
      rows: 240,
      columns: 18,
      autoRange: "A1:R240",
      printRange: "A1:R240",
      rangeSource: "auto",
      checked: true
    },
    {
      id: "sheet_notes",
      name: "辅助说明",
      shortName: "辅助说明",
      rows: 18,
      columns: 4,
      autoRange: "A1:D18",
      printRange: "A1:D18",
      rangeSource: "auto",
      checked: false
    }
  ].map((sheet) => ({ ...sheet, workbook: filename }));
}

function createDemoWorkbookSession(file) {
  const filename = file.name || "未命名表格.xlsx";
  const extension = filename.split(".").pop().toLowerCase();
  const allowed = ["xlsx", "xls", "csv", "xlsm"];

  if (!allowed.includes(extension)) {
    throw new Error("仅支持 xlsx、xls、xlsm 或 csv 文件");
  }

  if (file.size > 20 * 1024 * 1024) {
    throw new Error("演示流程仅支持 20MB 以内的文件");
  }

  const sessionSheets = createDemoSheets(filename, extension === "csv");

  return normalizeSession({
    id: `workbook_${Date.now()}`,
    filename,
    path: file.path || file.tempFilePath || "",
    size: file.size || 0,
    extension,
    mode: "local-demo",
    plans: PLAN_LIBRARY,
    sheets: sessionSheets,
    selectedSheetIds: sessionSheets.filter((sheet) => sheet.checked).map((sheet) => sheet.id)
  });
}

function estimatePages(sheet, plan) {
  const rowBlock = plan.fitMode === "singlePage" ? sheet.rows : plan.fitMode === "fitRows" ? 40 : 28;
  const colBlock = plan.fitMode === "singlePage" ? sheet.columns : plan.fitMode === "fitColumns" ? 10 : 6;
  const rowPages = Math.max(1, Math.ceil(sheet.rows / Math.max(1, rowBlock)));
  const colPages = Math.max(1, Math.ceil(sheet.columns / Math.max(1, colBlock)));

  return rowPages * colPages;
}

function buildPrintTargets(session, settings = {}, fallbackPlan = "fit-columns") {
  const normalized = normalizeSession(session || {});
  const fallback = resolveClientPlan(fallbackPlan, settings);

  return normalized.sheets
    .filter((sheet) => normalized.selectedSheetIds.includes(sheet.id))
    .map((sheet) => ({
      sheet: sheet.name,
      range: sheet.printRange || sheet.autoRange,
      rangeSource: sheet.rangeSource || "auto",
      plan: resolveClientPlan(sheet.plan || fallback, settings)
    }));
}

function createDemoPrintJob(session, planId, settings) {
  const plan = resolveClientPlan(planId, settings);
  const selectedSheets = getSelectedSheets(session.selectedSheetIds, session.sheets);
  const targets = buildPrintTargets(session, settings, planId);
  const previewSheets = selectedSheets.map((sheet) => {
    const target = targets.find((item) => item.sheet === sheet.name) || {};
    const targetPlan = target.plan || plan;

    return {
      name: sheet.name,
      range: target.range || sheet.printRange || sheet.autoRange,
      rows: sheet.rows,
      columns: sheet.columns,
      plan: targetPlan,
      pageCount: estimatePages(sheet, targetPlan)
    };
  });

  return {
    id: `job_${Date.now()}`,
    status: "ready",
    mode: "local-demo",
    workbook: {
      filename: session.filename,
      extension: session.extension,
      size: session.size
    },
    selectedSheets,
    targets,
    plan,
    settings: { ...resolveClientPlan(planId, settings) },
    preview: {
      selectedSheetCount: previewSheets.length,
      originalPageCount: previewSheets.reduce((sum, sheet) => sum + Math.max(1, sheet.pageCount + 2), 0),
      optimizedPageCount: previewSheets.reduce((sum, sheet) => sum + sheet.pageCount, 0),
      sheets: previewSheets
    },
    outputs: [
      { id: "optimized-xlsx", label: "优化 Excel", state: "演示模式已准备" },
      { id: "print-pdf", label: "打印 PDF", state: "演示模式已准备" }
    ],
    downloads: []
  };
}

function updateSessionSheetRange(session, sheetId, nextRange) {
  const cleanRange = String(nextRange || "").trim().toUpperCase();

  return normalizeSession({
    ...session,
    sheets: (session.sheets || []).map((sheet) => {
      if (sheet.id !== sheetId) {
        return sheet;
      }

      return {
        ...sheet,
        printRange: cleanRange || sheet.autoRange,
        rangeSource: !cleanRange || cleanRange === sheet.autoRange ? "auto" : "manual"
      };
    })
  });
}

function resetSessionSheetRange(session, sheetId) {
  return normalizeSession({
    ...session,
    sheets: (session.sheets || []).map((sheet) => {
      if (sheet.id !== sheetId) {
        return sheet;
      }

      return {
        ...sheet,
        printRange: sheet.autoRange,
        rangeSource: "auto"
      };
    })
  });
}

function applyPlanToSheet(session, sheetId, planId, settings = {}) {
  return normalizeSession({
    ...session,
    sheets: (session.sheets || []).map((sheet) => {
      if (sheet.id !== sheetId) {
        return sheet;
      }

      return {
        ...sheet,
        plan: resolveClientPlan(planId, settings)
      };
    })
  });
}

function applyPlanToSelectedSheets(session, planId, settings = {}) {
  const selectedIds = new Set(session.selectedSheetIds || []);

  return normalizeSession({
    ...session,
    sheets: (session.sheets || []).map((sheet) => {
      if (!selectedIds.has(sheet.id)) {
        return sheet;
      }

      return {
        ...sheet,
        plan: resolveClientPlan(planId, settings)
      };
    })
  });
}

module.exports = {
  RANGE_PATTERN,
  PLAN_LIBRARY,
  createAnalysisSnapshot,
  createBackendWorkbookSession,
  createDemoPrintJob,
  createDemoWorkbookSession,
  applyPlanToSelectedSheets,
  applyPlanToSheet,
  buildPrintTargets,
  formatFitModeLabel,
  formatRangeSourceLabel,
  getComparisonSlides,
  getDefaultPrintSettings,
  getPlanById,
  getPromoSlides,
  getRecentFiles,
  getSelectedSheets,
  isValidRange,
  normalizeSession,
  printSettings: DEFAULT_PRINT_SETTINGS,
  plans: PLAN_LIBRARY,
  resetSessionSheetRange,
  resolveClientPlan,
  sheets: SHEET_LIBRARY,
  updateSessionSheetRange
};
