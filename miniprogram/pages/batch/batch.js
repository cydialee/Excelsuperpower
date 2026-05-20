const { getRecentFiles } = require("../../utils/workflow");

Page({
  data: {
    files: getRecentFiles()
  },

  goBack() {
    wx.navigateBack();
  },

  startBatch() {
    wx.showModal({
      title: "批量打印任务",
      content: "前端流程已就绪，接入生成接口后将在这里创建批量任务。",
      showCancel: false
    });
  }
});
