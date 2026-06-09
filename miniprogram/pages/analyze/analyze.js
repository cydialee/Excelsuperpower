const {
  createAnalysisSnapshot,
  formatRangeSourceLabel,
  isValidRange,
  normalizeSession,
  resetSessionSheetRange,
  updateSessionSheetRange
} = require("../../utils/workflow");

const ANALYSIS_MESSAGES = [
  {
    badge: "读取结构",
    title: "正在为这份表格建立打印结构",
    detail: "先识别可见 Sheet、打印区域和表头，再确定分页和方向建议。",
    focus: "表头与打印范围"
  },
  {
    badge: "校验范围",
    title: "逐个 Sheet 对齐 Excel 打印语义",
    detail: "如果文件里已有原打印区域，系统会优先保留；否则使用自动识别结果。",
    focus: "原打印区与人工选区"
  },
  {
    badge: "生成建议",
    title: "正在整理更可信的优化方案",
    detail: "后续的方案推荐、分页预览和导出都会基于当前确认的打印区域继续计算。",
    focus: "分页方式与导出结果"
  }
];

const FOOTER_HINTS = [
  "建议先确认每个 Sheet 的打印区域，再进入方案对比，这样预览结果会更接近 Excel。",
  "若系统识别到 Excel 原打印区域，会显示“沿用 Excel”，你也可以再手动改成新的 A1 范围。",
  "批量任务页支持把当前已选 Sheet 继续统一调整。"
];

function buildProgressHighlights(session) {
  const selectedCount = (session.selectedSheetIds || []).length;
  const manualCount = (session.sheets || []).filter(
    (sheet) => session.selectedSheetIds.includes(sheet.id) && sheet.rangeSource === "manual"
  ).length;

  return [
    `${selectedCount} 个已选 Sheet`,
    `${manualCount} 个人工选区`,
    session && session.mode === "backend" ? "真实文件解析" : "本地演示流程"
  ];
}

function decorateSession(session) {
  const normalized = normalizeSession(session || {});

  return {
    ...normalized,
    sheets: normalized.sheets.map((sheet) => ({
      ...sheet,
      rangeSourceLabel: formatRangeSourceLabel(sheet.rangeSource)
    }))
  };
}

Page({
  data: {
    progress: 12,
    ready: false,
    session: null,
    selectedSheetIds: [],
    pageReady: false,
    activeAnalysisIndex: 0,
    analysisMessages: ANALYSIS_MESSAGES,
    footerHint: FOOTER_HINTS[0],
    progressHighlights: [],
    snapshot: createAnalysisSnapshot(["sales"]),
    steps: [
      { label: "读取工作簿内容", done: true },
      { label: "识别有效 Sheet", done: false },
      { label: "确认打印区域", done: false },
      { label: "分析分页风险", done: false },
      { label: "输出优化建议", done: false }
    ]
  },

  onLoad() {
    const stored = wx.getStorageSync("printmindWorkbook");
    const session = decorateSession(stored);

    if (!session || !session.sheets || !session.sheets.length) {
      wx.showToast({ title: "请先上传 Excel", icon: "none" });
      return;
    }

    const snapshot = createAnalysisSnapshot(session.selectedSheetIds, session.sheets);

    this.setData({
      session,
      selectedSheetIds: session.selectedSheetIds,
      progressHighlights: buildProgressHighlights(session),
      snapshot
    });

    this.enterPage();
    this.startMessageMotion();

    this.timer = setInterval(() => {
      if (this.data.progress >= 96) {
        clearInterval(this.timer);
        this.setData({
          progress: 100,
          ready: true,
          footerHint: "分析完成，可以继续校对打印区域、进入批量调整，或直接查看分析地图。",
          steps: this.data.steps.map((step) => ({ ...step, done: true }))
        });
        return;
      }

      const progress = this.data.progress + 14;
      const activeAnalysisIndex = Math.min(
        ANALYSIS_MESSAGES.length - 1,
        Math.floor(progress / 34)
      );
      const completeCount = Math.min(this.data.steps.length, Math.floor(progress / 22));

      this.setData({
        progress,
        activeAnalysisIndex,
        footerHint: FOOTER_HINTS[activeAnalysisIndex],
        steps: this.data.steps.map((step, index) => ({ ...step, done: index < completeCount }))
      });
    }, 320);
  },

  onShow() {
    if (!this.analysisTimer) {
      this.startMessageMotion();
    }
    this.enterPage();
  },

  onHide() {
    this.clearTimers();
  },

  onUnload() {
    this.clearTimers();
  },

  enterPage() {
    this.setData({ pageReady: false });
    clearTimeout(this.enterTimer);
    this.enterTimer = setTimeout(() => {
      this.setData({ pageReady: true });
    }, 40);
  },

  startMessageMotion() {
    clearInterval(this.analysisTimer);
    this.analysisTimer = setInterval(() => {
      if (this.data.ready) {
        return;
      }

      const nextIndex = (this.data.activeAnalysisIndex + 1) % ANALYSIS_MESSAGES.length;
      this.setData({
        activeAnalysisIndex: nextIndex,
        footerHint: FOOTER_HINTS[nextIndex]
      });
    }, 1900);
  },

  clearTimers() {
    clearInterval(this.timer);
    clearInterval(this.analysisTimer);
    clearTimeout(this.enterTimer);
    this.timer = null;
    this.analysisTimer = null;
    this.enterTimer = null;
  },

  persistSession(session) {
    wx.setStorageSync("printmindWorkbook", session);
    this.setData({
      session,
      selectedSheetIds: session.selectedSheetIds,
      progressHighlights: buildProgressHighlights(session),
      snapshot: createAnalysisSnapshot(session.selectedSheetIds, session.sheets)
    });
  },

  goBack() {
    wx.navigateBack();
  },

  onSheetChange(event) {
    const selectedSheetIds = event.detail.value;
    const session = decorateSession({
      ...this.data.session,
      selectedSheetIds
    });

    this.persistSession(session);
  },

  onRangeBlur(event) {
    const sheetId = event.currentTarget.dataset.id;
    const nextRange = String(event.detail.value || "").trim().toUpperCase();

    if (!nextRange) {
      const session = decorateSession(resetSessionSheetRange(this.data.session, sheetId));
      this.persistSession(session);
      return;
    }

    if (!isValidRange(nextRange)) {
      wx.showToast({ title: "请输入合法的 A1 范围，例如 B3:H42", icon: "none" });
      return;
    }

    const session = decorateSession(updateSessionSheetRange(this.data.session, sheetId, nextRange));
    this.persistSession(session);
  },

  resetRange(event) {
    const sheetId = event.currentTarget.dataset.id;
    const session = decorateSession(resetSessionSheetRange(this.data.session, sheetId));
    this.persistSession(session);
  },

  openBatch() {
    wx.navigateTo({ url: "/pages/batch/batch" });
  },

  seeReport() {
    if (!this.data.selectedSheetIds.length) {
      wx.showToast({ title: "至少选择一个 Sheet", icon: "none" });
      return;
    }
    wx.navigateTo({ url: "/pages/report/report" });
  }
});
