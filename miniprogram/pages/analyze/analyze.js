const ANALYSIS_MESSAGES = [
  {
    badge: "读取结构",
    title: "正在为这份表格建立打印模型",
    detail: "先识别 Sheet、表头、区域边界，再判断哪些位置适合分页。",
    focus: "表头与打印范围"
  },
  {
    badge: "分析布局",
    title: "AI 正在判断宽表、长表和跨页风险",
    detail: "把列宽、行高、标题重复和页面方向一起纳入分析。",
    focus: "列宽与横向分页"
  },
  {
    badge: "生成建议",
    title: "正在整理可执行的优化方案",
    detail: "输出更适合纸面阅读的版式建议，并准备后续导出结果。",
    focus: "导出方案与节省页数"
  }
];
const FOOTER_HINTS = [
  "小贴士：会优先处理分页、表头和纸张方向这三类问题。",
  "小贴士：宽表更适合横向分页，长表更适合压缩重复表头。",
  "小贴士：AI 建议整理完后，会直接带你进入后续优化结果页。"
];

function buildProgressHighlights(session, selectedSheetIds) {
  return [
    `${(selectedSheetIds || []).length} 个 Sheet`,
    "3 类建议",
    session && session.mode === "backend" ? "真实文件解析" : "本地示例流程"
  ];
}

function syncCheckedSheets(session, selectedSheetIds) {
  const activeIds = selectedSheetIds || [];

  return {
    ...session,
    sheets: (session.sheets || []).map((sheet) => ({
      ...sheet,
      preview: sheet.preview || [],
      checked: activeIds.includes(sheet.id)
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
    steps: [
      { label: "读取文件内容", done: true },
      { label: "识别表格结构", done: false },
      { label: "分析数据区域", done: false },
      { label: "检测打印问题", done: false },
      { label: "生成优化建议", done: false }
    ]
  },

  onLoad() {
    const rawSession = wx.getStorageSync("printmindWorkbook");
    const selectedSheetIds = rawSession && rawSession.selectedSheetIds ? rawSession.selectedSheetIds : [];
    const session = rawSession ? syncCheckedSheets(rawSession, selectedSheetIds) : null;
    if (!session) {
      wx.showToast({ title: "请先上传 Excel", icon: "none" });
      return;
    }

    this.setData({
      session,
      selectedSheetIds,
      progressHighlights: buildProgressHighlights(session, selectedSheetIds)
    });

    this.enterPage();
    this.startMessageMotion();

    this.timer = setInterval(() => {
      if (this.data.progress >= 96) {
        clearInterval(this.timer);
        this.setData({
          progress: 100,
          ready: true,
          footerHint: "分析完成，可以查看风险地图并继续选择优化方案。",
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
    clearInterval(this.analysisTimer);
    clearTimeout(this.enterTimer);
    this.analysisTimer = null;
    this.enterTimer = null;
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

  goBack() {
    wx.navigateBack();
  },

  onSheetChange(event) {
    const selectedSheetIds = event.detail.value;
    const session = syncCheckedSheets(
      { ...this.data.session, selectedSheetIds },
      selectedSheetIds
    );
    wx.setStorageSync("printmindWorkbook", session);
    this.setData({
      session,
      selectedSheetIds,
      progressHighlights: buildProgressHighlights(session, selectedSheetIds)
    });
  },

  seeReport() {
    if (!this.data.selectedSheetIds.length) {
      wx.showToast({ title: "至少选择一个 Sheet", icon: "none" });
      return;
    }
    wx.navigateTo({ url: "/pages/report/report" });
  }
});
