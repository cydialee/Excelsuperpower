const { createAnalysisSnapshot } = require("../../utils/workflow");

function buildReportTags(snapshot) {
  return [
    `发现 ${snapshot.opportunities.length} 类优化点`,
    `${snapshot.metrics[1].value} 人工选区`,
    "下一步进入方案对比与打印设置"
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
    wx.setStorageSync("printmindSelectedPlan", "fit-columns");
    wx.switchTab({ url: "/pages/plans/plans" });
  }
});
