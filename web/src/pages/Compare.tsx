import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, FileText, Zap, TrendingDown } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import PageSimulation from '@/components/ui/PageSimulation';
import EmptyState from '@/components/ui/EmptyState';
import { useSession } from '@/context/SessionContext';
import { getPreview } from '@/api/client';
import { getPlanById, PLAN_ENHANCED } from '@/lib/plans';
import type { PreviewResponse } from '@/api/client';

const COMPARISON_SLIDES = [
  { id: 'pages', title: '分页结构', beforePages: 8, afterPages: 4, paperUse: '92%', saving: '18%' },
  { id: 'header', title: '重复表头', beforePages: 6, afterPages: 4, paperUse: '88%', saving: '12%' },
  { id: 'width', title: '宽表方向', beforePages: 10, afterPages: 5, paperUse: '95%', saving: '22%' },
];

export default function Compare() {
  const navigate = useNavigate();
  const { planId = 'fit-columns' } = useParams();
  const { state } = useSession();
  const [previewData, setPreviewData] = useState<PreviewResponse | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [loading, setLoading] = useState(false);

  const plan = getPlanById(planId);
  const enhanced = PLAN_ENHANCED.find((p) => p.id === plan.id);

  useEffect(() => {
    // Try fetching backend preview if available
    if (state.mode === 'backend' && state.workbookId) {
      setLoading(true);
      const targets = state.sheets
        .filter((s) => state.selectedSheetIds.includes(s.name))
        .map((s) => ({
          sheet: s.name,
          range: s.printRange,
          rangeSource: s.rangeSource,
        }));

      getPreview(state.workbookId, targets, planId)
        .then(setPreviewData)
        .catch(() => setPreviewData(null))
        .finally(() => setLoading(false));
    }
  }, [state.workbookId, state.mode, planId, state.sheets, state.selectedSheetIds]);

  // Rotate comparison slides
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((i) => (i + 1) % COMPARISON_SLIDES.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  const slide = COMPARISON_SLIDES[activeSlide];

  const selectedSheets = state.sheets.filter((s) => state.selectedSheetIds.includes(s.name));
  const totalRows = selectedSheets.reduce((sum, s) => sum + s.rows, 0);
  const originalPages = Math.ceil(totalRows / 30) * Math.ceil(Math.max(...(selectedSheets.map((s) => s.columns) || [1]), 1) / 6);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Back */}
      <button onClick={() => navigate('/plans')} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors">
        <ArrowLeft size={16} />
        返回方案列表
      </button>

      {/* Header */}
      <div>
        <div className="section-kicker mb-2">Print Preview</div>
        <h1 className="text-xl font-extrabold text-slate-800">对比预览</h1>
        <p className="text-sm text-slate-500 mt-1">
          {plan.name} · {plan.orientation === 'landscape' ? '横向' : '纵向'}
        </p>
      </div>

      {/* VS comparison */}
      <Card padding="lg">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-xs text-slate-400">原始结果</span>
          <div className="flex-1 h-1 bg-slate-100 rounded-full">
            <div className="h-full w-1/2 bg-primary-400 rounded-full" />
          </div>
          <span className="text-xs font-bold text-primary-600">优化后结果</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Before */}
          <div className="p-4 rounded-card bg-slate-50 border border-slate-100">
            <div className="text-[10px] text-slate-400 mb-2 uppercase tracking-wider">原始效果</div>
            <div className="text-2xl font-extrabold text-slate-400">{slide.beforePages}</div>
            <div className="text-[11px] text-slate-400">页</div>
            <div className="mt-3 flex gap-1">
              {Array.from({ length: slide.beforePages }).map((_, i) => (
                <div key={i} className="w-5 h-7 rounded-sm bg-slate-200 border border-slate-300" />
              ))}
            </div>
          </div>

          {/* After */}
          <div className="p-4 rounded-card bg-primary-50 border border-primary-200">
            <div className="text-[10px] text-primary-500 mb-2 uppercase tracking-wider">优化后效果</div>
            <div className="text-2xl font-extrabold text-primary-600">{slide.afterPages}</div>
            <div className="text-[11px] text-primary-500">页</div>
            <div className="mt-3 flex gap-1">
              {Array.from({ length: slide.afterPages }).map((_, i) => (
                <div key={i} className="w-5 h-7 rounded-sm bg-primary-300 border border-primary-400" />
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Saving metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-card bg-emerald-50 text-center">
          <TrendingDown size={16} className="text-emerald-500 mx-auto mb-1" />
          <div className="text-sm font-extrabold text-emerald-600">{slide.saving}</div>
          <div className="text-[10px] text-slate-400">节约纸张</div>
        </div>
        <div className="p-3 rounded-card bg-primary-50 text-center">
          <Zap size={16} className="text-primary-500 mx-auto mb-1" />
          <div className="text-sm font-extrabold text-primary-600">{slide.paperUse}</div>
          <div className="text-[10px] text-slate-400">纸张利用率</div>
        </div>
        <div className="p-3 rounded-card bg-amber-50 text-center">
          <FileText size={16} className="text-amber-500 mx-auto mb-1" />
          <div className="text-sm font-extrabold text-amber-600">{slide.beforePages - slide.afterPages} 页</div>
          <div className="text-[10px] text-slate-400">减少页数</div>
        </div>
      </div>

      {/* Page preview (backend) */}
      {previewData?.preview?.sheets && previewData.preview.sheets.length > 0 ? (
        <Card padding="lg">
          <h3 className="text-sm font-bold text-slate-700 mb-4">分页模拟预览</h3>
          <div className="space-y-6">
            {previewData.preview.sheets.map((s) => (
              <PageSimulation key={s.name} sheet={s} />
            ))}
          </div>
        </Card>
      ) : (
        <Card padding="lg">
          <h3 className="text-sm font-bold text-slate-700 mb-3">分页模拟预览</h3>
          {/* Demo page simulation */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {Array.from({ length: Math.min(slide.afterPages, 4) }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[160px] rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="px-2 py-1 bg-slate-50 text-[10px] text-slate-400">第 {i + 1} 页</div>
                <div className="p-2">
                  {Array.from({ length: 6 }).map((_, r) => (
                    <div key={r} className="flex gap-1 mb-0.5">
                      {Array.from({ length: 3 }).map((_, c) => (
                        <div key={c} className="flex-1 h-1.5 rounded-sm bg-slate-100" />
                      ))}
                    </div>
                  ))}
                </div>
                {i > 0 && (
                  <div className="px-2 py-0.5 bg-amber-50 text-[9px] text-amber-600 text-center">↻ 重复表头</div>
                )}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-2">演示模式 · 实际效果请上传真实文件并通过后端预览</p>
        </Card>
      )}

      {/* Confirm */}
      <Button
        onClick={() => navigate('/settings')}
        className="w-full"
        size="lg"
        icon={<Check size={18} />}
      >
        确认使用此方案
      </Button>
    </motion.div>
  );
}
