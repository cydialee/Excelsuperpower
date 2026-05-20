Page({
  data: {
    templates: [
      { id: "finance", name: "财务报表模板", count: "1.2w 人使用", tone: "green" },
      { id: "sales", name: "销售清单模板", count: "8.7k 人使用", tone: "pink" },
      { id: "stock", name: "库存管理模板", count: "6.3k 人使用", tone: "blue" },
      { id: "salary", name: "工资表模板", count: "4.1k 人使用", tone: "yellow" },
      { id: "compare", name: "对账单模板", count: "3.2k 人使用", tone: "green" },
      { id: "attendance", name: "签到表模板", count: "2.9k 人使用", tone: "pink" },
      { id: "quote", name: "报价单模板", count: "2.4k 人使用", tone: "blue" },
      { id: "training", name: "培训名单模板", count: "1.8k 人使用", tone: "yellow" }
    ],
    categories: ["全部", "财务报表", "销售清单", "库存管理", "教育培训", "行政人事", "更多"]
  },

  useTemplate() {
    wx.navigateTo({ url: "/pages/settings/settings" });
  }
});
