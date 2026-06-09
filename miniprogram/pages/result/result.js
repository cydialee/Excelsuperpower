Page({
  data: {
    job: null
  },

  onLoad() {
    const job = wx.getStorageSync("printmindPrintJob");
    this.setData({ job });
  },

  goBack() {
    wx.navigateBack();
  },

  copyRecipe() {
    wx.setClipboardData({
      data: JSON.stringify(this.data.job, null, 2),
      success: () => {
        wx.showToast({ title: "已复制任务配置", icon: "none" });
      }
    });
  },

  download(event) {
    const url = `${getApp().globalData.assetBaseUrl}${event.currentTarget.dataset.url}`;
    wx.downloadFile({
      url,
      success: (download) => {
        wx.openDocument({
          filePath: download.tempFilePath,
          showMenu: true
        });
      },
      fail: () => wx.showToast({ title: "下载失败", icon: "none" })
    });
  },

  restart() {
    wx.reLaunch({ url: "/pages/index/index" });
  }
});
