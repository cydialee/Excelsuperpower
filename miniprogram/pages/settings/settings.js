const {
  buildPrintTargets,
  createDemoPrintJob,
  getDefaultPrintSettings,
  getPlanById,
  resolveClientPlan
} = require("../../utils/workflow");

Page({
  data: {
    settings: getDefaultPrintSettings(),
    currentPlan: getPlanById("fit-columns"),
    fitModes: [
      { id: "fitColumns", label: "按列适配" },
      { id: "fitRows", label: "按行适配" },
      { id: "singlePage", label: "整表单页" }
    ],
    marginPresets: [
      { id: "normal", label: "标准边距" },
      { id: "compact", label: "紧凑边距" }
    ]
  },

  onShow() {
    const planId = wx.getStorageSync("printmindSelectedPlan") || "fit-columns";
    const currentPlan = getPlanById(planId);
    this.setData({
      currentPlan,
      settings: resolveClientPlan(currentPlan.id, this.data.settings)
    });
  },

  goBack() {
    wx.navigateBack();
  },

  setOrientation(event) {
    this.setData({ "settings.orientation": event.currentTarget.dataset.value });
  },

  setPaper(event) {
    this.setData({ "settings.paper": event.currentTarget.dataset.value });
  },

  setFitMode(event) {
    const fitMode = event.currentTarget.dataset.value;
    this.setData({
      settings: resolveClientPlan(this.data.currentPlan.id, {
        ...this.data.settings,
        fitMode
      })
    });
  },

  setMarginPreset(event) {
    const marginPreset = event.currentTarget.dataset.value;
    this.setData({
      "settings.marginPreset": marginPreset,
      "settings.margin": marginPreset
    });
  },

  toggle(event) {
    const key = event.currentTarget.dataset.key;
    this.setData({ [`settings.${key}`]: !this.data.settings[key] });
  },

  onWrapColumnsBlur(event) {
    this.setData({ "settings.wrapTextColumns": String(event.detail.value || "").trim().toUpperCase() });
  },

  openBatch() {
    wx.navigateTo({ url: "/pages/batch/batch" });
  },

  saveSettings() {
    const session = wx.getStorageSync("printmindWorkbook");
    if (!session) {
      wx.showToast({ title: "请先上传 Excel", icon: "none" });
      return;
    }

    const planId = wx.getStorageSync("printmindSelectedPlan") || this.data.currentPlan.id || "fit-columns";
    const plan = resolveClientPlan(planId, this.data.settings);
    const printTargets = buildPrintTargets(session, this.data.settings, planId);

    if (!printTargets.length) {
      wx.showToast({ title: "请至少选择一个 Sheet", icon: "none" });
      return;
    }

    if (session.mode === "backend") {
      wx.showLoading({ title: "生成文件中..." });
      wx.request({
        url: `${getApp().globalData.apiBaseUrl}/optimize`,
        method: "POST",
        data: {
          workbookId: session.id,
          printTargets,
          plan
        },
        success: (response) => {
          wx.hideLoading();
          if (response.statusCode >= 400 || response.data.error) {
            wx.showToast({ title: response.data.error || "生成失败", icon: "none" });
            return;
          }
          wx.setStorageSync("printmindPrintJob", {
            status: "ready",
            mode: "backend",
            workbook: { filename: session.filename },
            selectedSheets: session.sheets.filter((sheet) => session.selectedSheetIds.includes(sheet.id)),
            targets: printTargets,
            plan: response.data.plan,
            settings: plan,
            downloads: response.data.downloads,
            preview: response.data.preview,
            warnings: response.data.warnings || []
          });
          wx.navigateTo({ url: "/pages/result/result" });
        },
        fail: () => {
          wx.hideLoading();
          wx.showToast({ title: "后端未响应", icon: "none" });
        }
      });
      return;
    }

    const job = createDemoPrintJob(session, planId, this.data.settings);
    wx.setStorageSync("printmindPrintJob", job);
    wx.navigateTo({ url: "/pages/result/result" });
  }
});
