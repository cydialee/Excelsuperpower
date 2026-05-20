Page({
  data: {
    progress: 12,
    ready: false,
    session: null,
    selectedSheetIds: [],
    steps: [
      { label: "读取文件内容", done: true },
      { label: "识别表格结构", done: true },
      { label: "分析数据区域", done: true },
      { label: "检测打印问题", done: true },
      { label: "生成优化建议", done: false }
    ]
  },

  onLoad() {
    const session = wx.getStorageSync("printmindWorkbook");
    if (!session) {
      wx.showToast({ title: "请先上传 Excel", icon: "none" });
      return;
    }

    this.setData({
      session,
      selectedSheetIds: session.selectedSheetIds
    });

    this.timer = setInterval(() => {
      if (this.data.progress >= 96) {
        clearInterval(this.timer);
        this.setData({
          progress: 100,
          ready: true,
          steps: this.data.steps.map((step) => ({ ...step, done: true }))
        });
        return;
      }

      const progress = this.data.progress + 14;
      const completeCount = Math.min(this.data.steps.length, Math.floor(progress / 22));
      this.setData({
        progress,
        steps: this.data.steps.map((step, index) => ({ ...step, done: index < completeCount }))
      });
    }, 320);
  },

  onUnload() {
    clearInterval(this.timer);
  },

  goBack() {
    wx.navigateBack();
  },

  onSheetChange(event) {
    const selectedSheetIds = event.detail.value;
    const session = { ...this.data.session, selectedSheetIds };
    wx.setStorageSync("printmindWorkbook", session);
    this.setData({ session, selectedSheetIds });
  },

  seeReport() {
    if (!this.data.selectedSheetIds.length) {
      wx.showToast({ title: "至少选择一个 Sheet", icon: "none" });
      return;
    }
    wx.navigateTo({ url: "/pages/report/report" });
  }
});
