const sheets = [
  {
    id: "sales",
    name: "销售数据分析_2024.xlsx",
    shortName: "销售数据总表",
    rows: 240,
    columns: 18,
    status: "分析完成"
  },
  {
    id: "finance",
    name: "财务报表_季度汇总.xlsx",
    shortName: "财务报表",
    rows: 84,
    columns: 12,
    status: "优化中 60%"
  },
  {
    id: "inventory",
    name: "库存管理明细_5月.xlsx",
    shortName: "库存明细",
    rows: 168,
    columns: 22,
    status: "等待中"
  }
];

const plans = [
  {
    id: "horizontal",
    name: "方案 A",
    title: "横向分页",
    pages: "4 页",
    paperUse: "92%",
    saving: "18%",
    recommended: true,
    score: 4
  },
  {
    id: "split",
    name: "方案 B",
    title: "拆分打印",
    pages: "3 页",
    paperUse: "85%",
    saving: "12%",
    recommended: false,
    score: 3
  },
  {
    id: "compact",
    name: "方案 C",
    title: "紧凑排版",
    pages: "2 页",
    paperUse: "78%",
    saving: "24%",
    recommended: false,
    score: 3
  }
];

const printSettings = {
  orientation: "landscape",
  paper: "A4",
  top: 12,
  bottom: 12,
  left: 10,
  right: 10,
  fitToWidth: true,
  repeatHeader: true,
  gridline: false
};

const promoSlides = [
  {
    id: "layout",
    title: "智能优化打印方案",
    subtitle: "一键重排宽表分页",
    tone: "layout"
  },
  {
    id: "sheets",
    title: "多 Sheet 打印体检",
    subtitle: "识别表头与异常区域",
    tone: "sheets"
  },
  {
    id: "batch",
    title: "批量打印任务舱",
    subtitle: "连续处理多个报表",
    tone: "batch"
  }
];

const comparisonSlides = [
  {
    id: "pages",
    title: "分页收敛",
    beforePages: 8,
    afterPages: 4,
    paperUse: "92%",
    saving: "18%"
  },
  {
    id: "header",
    title: "表头重复",
    beforePages: 6,
    afterPages: 4,
    paperUse: "88%",
    saving: "12%"
  },
  {
    id: "width",
    title: "宽表横向",
    beforePages: 10,
    afterPages: 5,
    paperUse: "95%",
    saving: "22%"
  }
];

function getRecentFiles() {
  return sheets.map((sheet, index) => ({
    ...sheet,
    updatedAt: ["今天 14:30", "昨天 09:12", "05-14 16:20"][index]
  }));
}

function getPromoSlides() {
  return promoSlides;
}

function getComparisonSlides() {
  return comparisonSlides;
}

function getSelectedSheets(ids, sourceSheets = sheets) {
  return ids.map((id) => sourceSheets.find((sheet) => sheet.id === id)).filter(Boolean);
}

function getPlanById(id) {
  return plans.find((plan) => plan.id === id) || plans[0];
}

function createAnalysisSnapshot(selectedIds, sourceSheets) {
  const selected = getSelectedSheets(selectedIds, sourceSheets);
  const count = selected.length || 2;

  return {
    score: 72,
    selected,
    summary: `已为 ${count} 个 Sheet 识别打印风险，建议优先优化分页和表头。`,
    opportunities: [
      { id: "header", label: "表头未重复", count: "2 处" },
      { id: "columns", label: "列宽过窄", count: "3 列" },
      { id: "pages", label: "分页不合理", count: "2 处" },
      { id: "merge", label: "合并单元格", count: "1 处" }
    ],
    metrics: [
      { label: "纸张利用率", value: "78%" },
      { label: "可节省纸张", value: "4 页" },
      { label: "预计节省成本", value: "¥2.40" }
    ]
  };
}

function createDemoSheets(filename, isCsv) {
  if (isCsv) {
    return [
      { id: "csv_data", name: "CSV 数据", rows: 180, columns: 12, checked: true }
    ];
  }

  return [
    { id: "sheet_summary", name: "汇总表", rows: 36, columns: 9, checked: true },
    { id: "sheet_detail", name: "明细数据", rows: 240, columns: 18, checked: true },
    { id: "sheet_notes", name: "辅助说明", rows: 18, columns: 4, checked: false }
  ].map((sheet) => ({ ...sheet, workbook: filename }));
}

function createDemoWorkbookSession(file) {
  const filename = file.name || "未命名表格.xlsx";
  const extension = filename.split(".").pop().toLowerCase();
  const allowed = ["xlsx", "xls", "csv"];

  if (!allowed.includes(extension)) {
    throw new Error("仅支持 xlsx、xls 或 csv 文件");
  }

  if (file.size > 20 * 1024 * 1024) {
    throw new Error("Demo 暂支持 20MB 以内文件");
  }

  const sessionSheets = createDemoSheets(filename, extension === "csv");

  return {
    id: `workbook_${Date.now()}`,
    filename,
    path: file.path || file.tempFilePath || "",
    size: file.size || 0,
    extension,
    mode: "local-demo",
    sheets: sessionSheets,
    selectedSheetIds: sessionSheets.filter((sheet) => sheet.checked).map((sheet) => sheet.id)
  };
}

function createDemoPrintJob(session, planId, settings) {
  const plan = getPlanById(planId);
  const selectedSheets = getSelectedSheets(session.selectedSheetIds, session.sheets);

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
    plan,
    settings: { ...settings },
    outputs: [
      { id: "optimized-xlsx", label: "优化 Excel 任务", state: "待后端生成" },
      { id: "print-pdf", label: "打印 PDF 任务", state: "待后端生成" }
    ]
  };
}

module.exports = {
  createAnalysisSnapshot,
  createDemoPrintJob,
  createDemoWorkbookSession,
  getComparisonSlides,
  getPlanById,
  getPromoSlides,
  getRecentFiles,
  getSelectedSheets,
  plans,
  printSettings,
  sheets
};
