const { createDemoPrintJob, printSettings } = require("../../utils/workflow");

Page({
  data: {
    settings: printSettings
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

  toggle(event) {
    const key = event.currentTarget.dataset.key;
    this.setData({ [`settings.${key}`]: !this.data.settings[key] });
  },

  saveSettings() {
    const session = wx.getStorageSync("printmindWorkbook");
    if (!session) {
      wx.showToast({ title: "请先上传 Excel", icon: "none" });
      return;
    }

    const planId = wx.getStorageSync("printmindSelectedPlan") || "standard";
    if (session.mode === "backend") {
      wx.showLoading({ title: "生成文件中" });
      wx.request({
        url: `${getApp().globalData.apiBaseUrl}/optimize`,
        method: "POST",
        data: {
          workbookId: session.id,
          sheets: session.selectedSheetIds,
          plan: { id: planId, ...this.data.settings }
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
            plan: response.data.plan,
            settings: this.data.settings,
            downloads: response.data.downloads,
            preview: response.data.preview
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
