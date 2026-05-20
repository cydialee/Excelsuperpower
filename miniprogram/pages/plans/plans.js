const { plans } = require("../../utils/workflow");

Page({
  data: {
    plans,
    selectedId: "horizontal",
    activeIndex: 0,
    filters: ["推荐方案", "节省优先", "效果优先", "自定义"]
  },

  onShow() {
    const session = wx.getStorageSync("printmindWorkbook");
    if (session && session.plans && session.plans.length) {
      const selectedId = wx.getStorageSync("printmindSelectedPlan") || session.plans[0].id;
      this.setData({
        plans: session.plans,
        selectedId,
        activeIndex: Math.max(0, session.plans.findIndex((plan) => plan.id === selectedId))
      });
    }
  },

  selectPlan(event) {
    const selectedId = event.currentTarget.dataset.id;
    wx.setStorageSync("printmindSelectedPlan", selectedId);
    this.setData({
      selectedId,
      activeIndex: Math.max(0, this.data.plans.findIndex((plan) => plan.id === selectedId))
    });
  },

  changePlan(event) {
    const activeIndex = event.detail.current;
    const plan = this.data.plans[activeIndex];
    if (!plan) return;
    wx.setStorageSync("printmindSelectedPlan", plan.id);
    this.setData({ activeIndex, selectedId: plan.id });
  },

  comparePlan() {
    wx.setStorageSync("printmindSelectedPlan", this.data.selectedId);
    wx.navigateTo({ url: `/pages/compare/compare?id=${this.data.selectedId}` });
  },

  tuneSettings() {
    wx.navigateTo({ url: "/pages/settings/settings" });
  }
});
