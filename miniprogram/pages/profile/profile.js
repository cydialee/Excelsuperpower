Page({
  data: {
    achievements: [
      { name: "初出茅庐", desc: "完成 10 次优化", tone: "blue" },
      { name: "节能先锋", desc: "节省 100 页纸", tone: "gold" },
      { name: "效率大师", desc: "连续 7 天使用", tone: "rose" }
    ],
    menus: [
      { name: "我的方案", count: 12 },
      { name: "我的模板", count: 8 },
      { name: "打印记录", count: 156 },
      { name: "批量任务", count: 3 },
      { name: "节纸报告", count: "¥48.60" },
      { name: "设置中心", count: "" }
    ],
    stats: [
      { label: "本月优化", value: "28 份" },
      { label: "累计节纸", value: "316 页" },
      { label: "常用模板", value: "财务" }
    ]
  },

  openSettings(event) {
    if (event.currentTarget.dataset.name === "设置中心") {
      wx.navigateTo({ url: "/pages/settings/settings" });
    }
  }
});
