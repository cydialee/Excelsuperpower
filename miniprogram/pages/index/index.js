const { getPromoSlides, getRecentFiles } = require("../../utils/workflow");
const { createDemoWorkbookSession } = require("../../utils/workflow");

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
    recentFiles: getRecentFiles()
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
  }
});
