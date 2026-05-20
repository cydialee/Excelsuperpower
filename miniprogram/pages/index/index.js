const mockSheets = [
  {
    id: "sheet_001",
    name: "销售明细",
    rows: 240,
    columns: 18,
    orientation: "建议横向",
    checked: true
  },
  {
    id: "sheet_002",
    name: "汇总表",
    rows: 36,
    columns: 9,
    orientation: "建议纵向",
    checked: true
  }
];

const printPlans = [
  {
    id: "standard",
    name: "标准清晰版",
    description: "保留可读字号，自动设置打印区域、重复标题行和页边距。"
  },
  {
    id: "compact",
    name: "节纸紧凑版",
    description: "适配一页宽，缩小页边距，适合内部流转和批量打印。"
  },
  {
    id: "wide",
    name: "宽表横向版",
    description: "横向打印并优化分页，适合列很多的台账和明细表。"
  }
];

Page({
  data: {
    fileName: "",
    sheets: [],
    selectedSheetIds: [],
    plans: [],
    selectedPlanId: "",
    diagnosis: "",
    generating: false,
    downloads: []
  },

  chooseExcel() {
    wx.chooseMessageFile({
      count: 1,
      type: "file",
      extension: ["xlsx", "xlsm"],
      success: (res) => {
        const file = res.tempFiles[0];
        const selectedSheetIds = mockSheets.filter((sheet) => sheet.checked).map((sheet) => sheet.id);

        this.setData({
          fileName: file.name,
          sheets: mockSheets,
          selectedSheetIds,
          plans: printPlans,
          selectedPlanId: "standard",
          diagnosis: "已识别 2 个 Sheet。建议为宽表启用横向打印，并为明细表重复首行表头。",
          downloads: []
        });
      }
    });
  },

  onSheetChange(event) {
    this.setData({
      selectedSheetIds: event.detail.value
    });
  },

  selectPlan(event) {
    const selectedPlanId = event.currentTarget.dataset.id;
    const plan = printPlans.find((item) => item.id === selectedPlanId);

    this.setData({
      selectedPlanId,
      diagnosis: plan ? `${plan.name}将用于当前选中的 Sheet，生成前会自动检查打印区域和分页。` : ""
    });
  },

  generateFiles() {
    if (!this.data.selectedSheetIds.length) {
      wx.showToast({
        title: "请先选择 Sheet",
        icon: "none"
      });
      return;
    }

    this.setData({ generating: true });

    setTimeout(() => {
      this.setData({
        generating: false,
        downloads: [
          {
            type: "pdf",
            label: "可打印 PDF",
            url: "https://example.com/downloads/demo.pdf"
          },
          {
            type: "xlsx",
            label: "优化 Excel",
            url: "https://example.com/downloads/demo.xlsx"
          }
        ]
      });
    }, 800);
  },

  copyDownloadUrl(event) {
    wx.setClipboardData({
      data: event.currentTarget.dataset.url
    });
  }
});
