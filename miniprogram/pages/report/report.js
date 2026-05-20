const { createAnalysisSnapshot } = require("../../utils/workflow");

Page({
  data: {
    snapshot: createAnalysisSnapshot(["sales", "finance"]),
    session: null
  },

  onShow() {
    const session = wx.getStorageSync("printmindWorkbook");
    if (session) {
      this.setData({
        session,
        snapshot: createAnalysisSnapshot(session.selectedSheetIds, session.sheets)
      });
    }
  },

  goBack() {
    wx.navigateBack();
  },

  seePlans() {
    wx.setStorageSync("printmindSelectedPlan", "horizontal");
    wx.switchTab({ url: "/pages/plans/plans" });
  }
});
