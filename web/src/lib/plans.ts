// ===== Plan Library & Print Settings (Ported from miniprogram/utils/workflow.js) =====
import type { PlanConfig } from '@/api/client';

export const PLAN_LIBRARY: PlanConfig[] = [
  {
    id: 'fit-columns',
    name: '标准归档版',
    description: '适合常规明细表，按宽度压到一页并保留表头。',
    orientation: 'landscape',
    fitMode: 'fitColumns',
    fitToWidth: 1,
    fitToHeight: 0,
    repeatHeader: true,
    freezeTopRow: true,
    margin: 'normal',
    beautify: true,
    showGridLines: false,
    wrapLongText: false,
    wrapTextColumns: '',
  },
  {
    id: 'single-page',
    name: '整表一页版',
    description: '小型表格整页压缩，适合汇报或单页归档。',
    orientation: 'portrait',
    fitMode: 'singlePage',
    fitToWidth: 1,
    fitToHeight: 1,
    repeatHeader: true,
    freezeTopRow: true,
    margin: 'normal',
    beautify: true,
    showGridLines: false,
    wrapLongText: false,
    wrapTextColumns: '',
  },
  {
    id: 'fit-rows',
    name: '长表纵向版',
    description: '适合窄而长的表格，尽量把行压缩在一页高度内。',
    orientation: 'portrait',
    fitMode: 'fitRows',
    fitToWidth: 0,
    fitToHeight: 1,
    repeatHeader: true,
    freezeTopRow: true,
    margin: 'normal',
    beautify: true,
    showGridLines: false,
    wrapLongText: false,
    wrapTextColumns: '',
  },
  {
    id: 'compact',
    name: '节纸紧凑版',
    description: '边距更窄，适合批量归档和节省纸张。',
    orientation: 'landscape',
    fitMode: 'fitColumns',
    fitToWidth: 1,
    fitToHeight: 0,
    repeatHeader: true,
    freezeTopRow: true,
    margin: 'compact',
    beautify: true,
    showGridLines: false,
    wrapLongText: false,
    wrapTextColumns: '',
  },
  {
    id: 'manual',
    name: '手动控制版',
    description: '保留高级设置入口，按当前页面设置输出。',
    orientation: 'landscape',
    fitMode: 'fitColumns',
    fitToWidth: 1,
    fitToHeight: 0,
    repeatHeader: false,
    freezeTopRow: false,
    margin: 'normal',
    beautify: false,
    showGridLines: true,
    wrapLongText: false,
    wrapTextColumns: '',
  },
];

export const DEFAULT_PRINT_SETTINGS = {
  paper: 'A4',
  orientation: 'landscape' as const,
  fitMode: 'fitColumns' as const,
  fitToWidth: 1,
  fitToHeight: 0,
  top: 12,
  bottom: 12,
  left: 10,
  right: 10,
  marginPreset: 'normal',
  margin: 'normal' as const,
  repeatHeader: true,
  freezeTopRow: true,
  beautify: true,
  showGridLines: false,
  centerHorizontally: true,
  centerVertically: false,
  wrapLongText: false,
  wrapTextColumns: '',
};

export const PLAN_ENHANCED = PLAN_LIBRARY.map((plan, index) => {
  const letters = ['A', 'B', 'C', 'D', 'E'];
  const paperUseValues = ['92%', '84%', '88%', '95%', '80%'];
  const savingValues = ['18%', '12%', '10%', '22%', '0%'];
  const pagesLabels = ['减少 4 页', '单页输出', '减少纵向翻页', '最省纸张', '保留原设置'];
  const scores = [5, 4, 4, 4, 3];

  return {
    ...plan,
    label: `方案 ${letters[index]}`,
    paperUse: paperUseValues[index],
    saving: savingValues[index],
    pages: pagesLabels[index],
    score: scores[index],
    recommended: index === 0,
  };
});

export function getPlanById(id: string): PlanConfig {
  return PLAN_LIBRARY.find((p) => p.id === id) || PLAN_LIBRARY[0];
}

export function resolvePlan(planOrId: string | Partial<PlanConfig>): PlanConfig {
  if (typeof planOrId === 'string') {
    return getPlanById(planOrId);
  }
  const base = getPlanById(planOrId.id || 'fit-columns');
  return { ...base, ...planOrId };
}

export function formatFitModeLabel(mode: string): string {
  if (mode === 'singlePage') return '整表单页';
  if (mode === 'fitRows') return '按行适配';
  return '按列适配';
}

export function formatRangeSourceLabel(source: string): string {
  if (source === 'excel') return '沿用 Excel';
  if (source === 'manual') return '人工调整';
  return '自动识别';
}

export function estimatePages(rows: number, columns: number, plan: PlanConfig): number {
  const rowBlock = plan.fitMode === 'singlePage' ? rows : plan.fitMode === 'fitRows' ? 40 : 28;
  const colBlock = plan.fitMode === 'singlePage' ? columns : plan.fitMode === 'fitColumns' ? 10 : 6;
  const rowPages = Math.max(1, Math.ceil(rows / Math.max(1, rowBlock)));
  const colPages = Math.max(1, Math.ceil(columns / Math.max(1, colBlock)));
  return rowPages * colPages;
}

export const PROMO_SLIDES = [
  {
    id: 'layout',
    title: '按 Excel 语义推荐打印方案',
    subtitle: '先识别 Sheet、打印区域和表头，再推荐更可信的分页方式。',
    tone: 'layout' as const,
  },
  {
    id: 'sheets',
    title: '逐个 Sheet 调整打印范围',
    subtitle: '支持保留 Excel 原打印区域，也能手动改成更精确的 A1 选区。',
    tone: 'sheets' as const,
  },
  {
    id: 'batch',
    title: '批量任务保留独立设置',
    subtitle: '同一个任务里，不同 Sheet 也能各自选择适配方式和范围。',
    tone: 'batch' as const,
  },
];

export const RECENT_FILES = [
  { id: 'sales', name: '销售数据分析_2024.xlsx', status: '建议已生成' },
  { id: 'finance', name: '财务报表_季度汇总.xlsx', status: '沿用 Excel 打印区域' },
  { id: 'inventory', name: '库存明细_5月.xlsx', status: '已人工缩小打印范围' },
];

export const TEMPLATE_DATA = [
  { id: 'finance', name: '财务报表模板', category: '财务报表', usage: 2840, tone: 'emerald' as const },
  { id: 'sales', name: '销售清单模板', category: '销售清单', usage: 1920, tone: 'blue' as const },
  { id: 'stock', name: '库存盘点表', category: '库存管理', usage: 1560, tone: 'amber' as const },
  { id: 'salary', name: '工资明细表', category: '行政人事', usage: 2310, tone: 'rose' as const },
  { id: 'compare', name: '对比分析表', category: '财务报表', usage: 890, tone: 'violet' as const },
  { id: 'attendance', name: '考勤统计表', category: '行政人事', usage: 1670, tone: 'cyan' as const },
  { id: 'quote', name: '报价单模板', category: '销售清单', usage: 720, tone: 'orange' as const },
  { id: 'training', name: '培训签到表', category: '教育培训', usage: 450, tone: 'pink' as const },
];

export const TEMPLATE_CATEGORIES = ['全部', '财务报表', '销售清单', '库存管理', '教育培训', '行政人事'];
