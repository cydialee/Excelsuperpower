const { createAnalysisSnapshot } = require("../../utils/workflow");

function buildReportTags(snapshot) {
  return [
    `发现 ${snapshot.opportunities.length} 类风险`,
    `${snapshot.metrics[0].value} 纸张利用率`,
    "可继续进入优化方案"
  ];
}

Page({
  data: {
    snapshot: createAnalysisSnapshot(["sales", "finance"]),
    session: null,
    pageReady: false,
    reportTags: buildReportTags(createAnalysisSnapshot(["sales", "finance"]))
  },

  onShow() {
    const session = wx.getStorageSync("printmindWorkbook");
    if (session) {
      const snapshot = createAnalysisSnapshot(session.selectedSheetIds, session.sheets);
      this.setData({
        session,
        snapshot,
        reportTags: buildReportTags(snapshot)
      });
    }

    this.setData({ pageReady: false });
    clearTimeout(this.enterTimer);
    this.enterTimer = setTimeout(() => {
      this.setData({ pageReady: true });
    }, 40);
  },

  onUnload() {
    clearTimeout(this.enterTimer);
  },

  goBack() {
    wx.navigateBack();
  },

  seePlans() {
    wx.setStorageSync("printmindSelectedPlan", "horizontal");
    wx.switchTab({ url: "/pages/plans/plans" });
  }
});
