const {
  createBackendWorkbookSession,
  createDemoWorkbookSession,
  getPromoSlides,
  getRecentFiles
} = require("../../utils/workflow");

const HERO_WORDS = ["更清晰", "更可信", "更体面"];
const HERO_LINES = [
  "自动识别表头、打印区域与宽表分页建议",
  "让预览、设置和导出都尽量贴近 Excel 打印逻辑",
  "一键输出优化后的 Excel、PDF 和批量任务配置"
];

const FLOW_STEPS = [
  { id: "import", index: "01", label: "导入文件", detail: "读取 Sheet 与现有打印区域" },
  { id: "range", index: "02", label: "确认范围", detail: "逐个 Sheet 校对打印区和方向" },
  { id: "plan", index: "03", label: "比较方案", detail: "按列、按行、单页和紧凑模式对比" },
  { id: "export", index: "04", label: "导出结果", detail: "生成 Excel、PDF 和批量打印任务" }
];

const HERO_METRICS = [
  { label: "默认识别准确区", value: "A1", tone: "mint" },
  { label: "打印模式", value: "5 种", tone: "sky" },
  { label: "导出结果", value: "Excel + PDF", tone: "gold" }
];

const FEATURE_CARDS = [
  {
    id: "layout",
    eyebrow: "打印语义",
    title: "先确定有效打印区域，再做分页推荐",
    detail: "系统会优先读取 Excel 原打印区域，没有时再用自动识别范围作为默认值。",
    stat: "范围优先"
  },
  {
    id: "repeat",
    eyebrow: "分页可信",
    title: "预览结果按表头、方向和适配方式生成",
    detail: "避免把所有方案都做成同一种“伪预览”，让对比结果更接近真实打印体验。",
    stat: "分页校准"
  },
  {
    id: "batch",
    eyebrow: "批量控制",
    title: "每个 Sheet 都能保留自己的打印方式",
    detail: "批量任务不再只是一键串行，而是支持逐个 Sheet 维护范围、方向和适配模式。",
    stat: "独立设置"
  }
];

function decorateRecentFiles(files) {
  const tones = ["mint", "coral", "sky"];

  return files.map((file, index) => ({
    ...file,
    tone: tones[index % tones.length]
  }));
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
        wx.showLoading({ title: "正在上传并识别..." });
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
            wx.setStorageSync("printmindWorkbook", createBackendWorkbookSession(payload));
            wx.navigateTo({ url: "/pages/analyze/analyze" });
          },
          fail: () => {
            wx.hideLoading();
            wx.showToast({ title: "请先启动本地预览后端", icon: "none" });
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
