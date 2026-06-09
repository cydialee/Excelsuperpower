const {
  applyPlanToSelectedSheets,
  applyPlanToSheet,
  formatFitModeLabel,
  getPlanById,
  isValidRange,
  normalizeSession,
  resetSessionSheetRange,
  updateSessionSheetRange
} = require("../../utils/workflow");

const QUICK_PLANS = [
  getPlanById("fit-columns"),
  getPlanById("fit-rows"),
  getPlanById("single-page")
];

function decorateSession(session) {
  const normalized = normalizeSession(session || {});

  return {
    ...normalized,
    sheets: normalized.sheets.map((sheet) => ({
      ...sheet,
      planLabel: formatFitModeLabel((sheet.plan && sheet.plan.fitMode) || "fitColumns")
    }))
  };
}

Page({
  data: {
    session: null,
    files: [],
    quickPlans: QUICK_PLANS,
    activePlanId: "fit-columns"
  },

  onShow() {
    const stored = wx.getStorageSync("printmindWorkbook");
    const session = decorateSession(stored);
    this.setData({
      session,
      files: session && session.sheets ? session.sheets.filter((sheet) => session.selectedSheetIds.includes(sheet.id)) : []
    });
  },

  goBack() {
    wx.navigateBack();
  },

  persist(session) {
    wx.setStorageSync("printmindWorkbook", session);
    this.setData({
      session,
      files: session.sheets.filter((sheet) => session.selectedSheetIds.includes(sheet.id))
    });
  },

  applyPresetToAll(event) {
    const planId = event.currentTarget.dataset.id;
    const session = decorateSession(applyPlanToSelectedSheets(this.data.session, planId));
    this.setData({ activePlanId: planId });
    this.persist(session);
  },

  applySheetPreset(event) {
    const sheetId = event.currentTarget.dataset.sheetId;
    const planId = event.currentTarget.dataset.planId;
    const session = decorateSession(applyPlanToSheet(this.data.session, sheetId, planId));
    this.persist(session);
  },

  onRangeBlur(event) {
    const sheetId = event.currentTarget.dataset.id;
    const nextRange = String(event.detail.value || "").trim().toUpperCase();

    if (!nextRange) {
      this.persist(decorateSession(resetSessionSheetRange(this.data.session, sheetId)));
      return;
    }

    if (!isValidRange(nextRange)) {
      wx.showToast({ title: "请输入合法的 A1 范围", icon: "none" });
      return;
    }

    this.persist(decorateSession(updateSessionSheetRange(this.data.session, sheetId, nextRange)));
  },

  startBatch() {
    if (!this.data.files.length) {
      wx.showToast({ title: "当前没有可批量处理的 Sheet", icon: "none" });
      return;
    }

    wx.showModal({
      title: "批量设置已保存",
      content: "当前批量页已把每个 Sheet 的打印范围和适配模式写回工作流。继续前往打印设置或结果页时，会按这些设置生成。",
      showCancel: false
    });
  }
});
