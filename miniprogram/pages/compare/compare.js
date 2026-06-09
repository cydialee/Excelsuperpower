const {
  buildPrintTargets,
  getComparisonSlides,
  getPlanById
} = require("../../utils/workflow");

Page({
  data: {
    plan: getPlanById("fit-columns"),
    slides: getComparisonSlides(),
    activeIndex: 0,
    preview: null,
    pages: []
  },

  onLoad(query) {
    const session = wx.getStorageSync("printmindWorkbook");
    const plan = session && session.plans
      ? session.plans.find((item) => item.id === query.id) || session.plans[0]
      : getPlanById(query.id || "fit-columns");
    this.setData({ plan });
    if (session && session.mode === "backend") {
      this.loadBackendPreview(session, plan);
    }
  },

  loadBackendPreview(session, plan) {
    wx.showLoading({ title: "生成分页预览" });
    wx.request({
      url: `${getApp().globalData.apiBaseUrl}/preview-plan`,
      method: "POST",
      data: {
        workbookId: session.id,
        printTargets: buildPrintTargets(session, plan, plan.id)
      },
      success: (response) => {
        wx.hideLoading();
        if (response.statusCode >= 400 || response.data.error) {
          wx.showToast({ title: response.data.error || "预览失败", icon: "none" });
          return;
        }
        const preview = response.data.preview;
        const pages = preview.sheets.reduce(
          (all, sheet) => all.concat(sheet.pages.map((page) => ({ ...page, sheet: sheet.name }))),
          []
        );
        this.setData({ preview, pages });
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: "后端预览未响应", icon: "none" });
      }
    });
  },

  changePreview(event) {
    this.setData({ activeIndex: event.detail.current });
  },

  goBack() {
    wx.navigateBack();
  },

  confirmPlan() {
    wx.navigateTo({ url: "/pages/settings/settings" });
  }
});
