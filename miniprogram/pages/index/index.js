const { getPromoSlides, getRecentFiles } = require("../../utils/workflow");
const { createDemoWorkbookSession } = require("../../utils/workflow");

const HERO_WORDS = ["更灵", "更清晰", "更专业"];
const HERO_LINES = [
  "自动识别表头、打印区域与宽表分页",
  "把复杂 Excel 变成更适合纸面的版式",
  "一键输出优化 Excel、PDF 与批量任务"
];
const FLOW_STEPS = [
  { id: "import", index: "01", label: "导入表格", detail: "读取 Sheet 与结构" },
  { id: "select", index: "02", label: "选择区域", detail: "筛选要打印的内容" },
  { id: "optimize", index: "03", label: "优化美化", detail: "生成分页与版式建议" },
  { id: "export", index: "04", label: "预览导出", detail: "输出 Excel / PDF" }
];
const HERO_METRICS = [
  { label: "典型节省", value: "18%", tone: "mint" },
  { label: "优化建议", value: "3 类", tone: "sky" },
  { label: "导出形态", value: "2 种", tone: "gold" }
];
const FEATURE_CARDS = [
  {
    id: "layout",
    eyebrow: "智能分页",
    title: "针对宽表与长表自动给出打印策略",
    detail: "把一页宽、横向分页、批量任务放到同一条操作链里。",
    stat: "分页建议"
  },
  {
    id: "repeat",
    eyebrow: "表头修复",
    title: "自动识别重复表头与关键字段位置",
    detail: "减少跨页后表头消失、字段错位和阅读断层。",
    stat: "结构识别"
  },
  {
    id: "batch",
    eyebrow: "导出闭环",
    title: "从分析结果直接走向优化 Excel 与 PDF",
    detail: "让打印前预览、下载和批量处理连成一个可执行流程。",
    stat: "输出闭环"
  }
];

function decorateRecentFiles(files) {
  const tones = ["mint", "coral", "sky"];

  return files.map((file, index) => ({
    ...file,
    tone: tones[index % tones.length]
  }));
}

function normalizeBackendWorkbook(payload) {
  return {
    id: payload.workbookId,
    filename: payload.filename,
    mode: "backend",
    plans: payload.plans,
    sheets: payload.sheets.map((sheet, index) => ({
      ...sheet,
      id: sheet.name,
      checked: index < 2
    })),
    selectedSheetIds: payload.sheets.slice(0, 2).map((sheet) => sheet.name)
  };
}

Page({
  data: {
    promoSlides: getPromoSlides(),
    recentFiles: decorateRecentFiles(getRecentFiles()),
    headlineWords: HERO_WORDS,
    heroStatusLine: HERO_LINES[0],
    flowSteps: FLOW_STEPS,
    heroMetrics: HERO_METRICS,
    featureCards: FEATURE_CARDS,
    activeHeroWordIndex: 0,
    activeFlowIndex: 0,
    activePromoIndex: 0,
    pageReady: false
  },

  onLoad() {
    this.enterPage();
    this.startHeroMotion();
  },

  onShow() {
    if (!this.heroWordTimer && !this.flowTimer) {
      this.startHeroMotion();
    }
    this.enterPage();
  },

  onHide() {
    this.clearMotionTimers();
  },

  onUnload() {
    this.clearMotionTimers();
  },

  enterPage() {
    this.setData({ pageReady: false });
    clearTimeout(this.enterTimer);
    this.enterTimer = setTimeout(() => {
      this.setData({ pageReady: true });
    }, 40);
  },

  startHeroMotion() {
    this.clearMotionTimers();

    this.heroWordTimer = setInterval(() => {
      const nextIndex = (this.data.activeHeroWordIndex + 1) % HERO_WORDS.length;
      this.setData({
        activeHeroWordIndex: nextIndex,
        heroStatusLine: HERO_LINES[nextIndex]
      });
    }, 2200);

    this.flowTimer = setInterval(() => {
      const nextIndex = (this.data.activeFlowIndex + 1) % FLOW_STEPS.length;
      this.setData({ activeFlowIndex: nextIndex });
    }, 2600);
  },

  clearMotionTimers() {
    clearInterval(this.heroWordTimer);
    clearInterval(this.flowTimer);
    clearTimeout(this.enterTimer);
    this.heroWordTimer = null;
    this.flowTimer = null;
    this.enterTimer = null;
  },

  chooseExcelFile() {
    wx.chooseMessageFile({
      count: 1,
      type: "file",
      extension: ["xlsx", "xlsm"],
      success: (res) => {
        const file = res.tempFiles[0];
        wx.showLoading({ title: "上传解析中" });
        wx.uploadFile({
          url: `${getApp().globalData.apiBaseUrl}/upload`,
          filePath: file.path,
          name: "file",
          success: (upload) => {
            wx.hideLoading();
            const payload = JSON.parse(upload.data || "{}");
            if (upload.statusCode >= 400 || payload.error) {
              wx.showToast({ title: payload.error || "上传失败", icon: "none" });
              return;
            }
            wx.setStorageSync("printmindWorkbook", normalizeBackendWorkbook(payload));
            wx.navigateTo({ url: "/pages/analyze/analyze" });
          },
          fail: () => {
            wx.hideLoading();
            wx.showToast({ title: "请先启动本地后端", icon: "none" });
          }
        });
      }
    });
  },

  previewFlow() {
    const session = createDemoWorkbookSession({
      name: "示例销售报表.xlsx",
      path: "demo://sample-workbook",
      size: 1024 * 380
    });
    wx.setStorageSync("printmindWorkbook", session);
    wx.navigateTo({ url: "/pages/analyze/analyze" });
  },

  openBatch() {
    wx.navigateTo({ url: "/pages/batch/batch" });
  },

  openRecent() {
    this.previewFlow();
  },

  handlePromoChange(event) {
    const activePromoIndex = event.detail.current || 0;

    this.setData({
      activePromoIndex,
      activeFlowIndex: activePromoIndex % FLOW_STEPS.length
    });
  }
});
