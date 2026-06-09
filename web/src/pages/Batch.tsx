import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Layers, Check, RotateCcw, Save } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useSession } from '@/context/SessionContext';
import { isValidRange } from '@/lib/range';
import { PLAN_LIBRARY, formatFitModeLabel, formatRangeSourceLabel } from '@/lib/plans';

const QUICK_PLANS = [
  { id: 'fit-columns', label: '按列适配', description: '宽表用' },
  { id: 'fit-rows', label: '按行适配', description: '长表用' },
  { id: 'single-page', label: '整表单页', description: '小型表用' },
];

export default function Batch() {
  const navigate = useNavigate();
  const { state, dispatch } = useSession();
  const [activePlanId, setActivePlanId] = useState('fit-columns');
  const [showConfirm, setShowConfirm] = useState(false);
  const [saved, setSaved] = useState(false);

  const selectedSheets = state.sheets.filter((s) => state.selectedSheetIds.includes(s.name));

  const applyPresetToAll = (planId: string) => {
    setActivePlanId(planId);
    dispatch({ type: 'APPLY_PLAN_TO_ALL', payload: planId });
  };

  const handleRangeChange = (sheetName: string, value: string) => {
    if (isValidRange(value)) {
      dispatch({ type: 'SET_SHEET_RANGE', payload: { sheetId: sheetName, range: value } });
    }
  };

  const resetRange = (sheetName: string) => {
    dispatch({ type: 'RESET_SHEET_RANGE', payload: sheetName });
  };

  const handleSave = () => {
    setShowConfirm(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Back */}
      <button onClick={() => navigate('/analyze')} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors">
        <ArrowLeft size={16} />
        返回分析
      </button>

      {/* Header */}
      <div>
        <div className="section-kicker mb-2">Batch Control</div>
        <h1 className="text-xl font-extrabold text-slate-800">批量任务舱</h1>
        <p className="text-sm text-slate-500 mt-1">
          {selectedSheets.length} 个 Sheet · 独立配置打印范围和方案
        </p>
      </div>

      {/* Quick apply panel */}
      <Card padding="md">
        <div className="flex items-center gap-2 mb-3">
          <Layers size={14} className="text-primary-500" />
          <span className="text-xs font-bold text-slate-600">快速应用到全部</span>
        </div>
        <div className="flex gap-2">
          {QUICK_PLANS.map((qp) => (
            <button
              key={qp.id}
              onClick={() => applyPresetToAll(qp.id)}
              className={`flex-1 p-2.5 rounded-card text-center transition-all ${
                activePlanId === qp.id
                  ? 'bg-primary-50 border-2 border-primary-400'
                  : 'bg-white border border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className="text-xs font-bold text-slate-700">{qp.label}</div>
              <div className="text-[10px] text-slate-400">{qp.description}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* Sheet queue */}
      <div className="space-y-3">
        {selectedSheets.map((sheet, i) => {
          const plan = PLAN_LIBRARY.find((p) => p.id === activePlanId);
          return (
            <motion.div
              key={sheet.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Card padding="md">
                <div className="flex items-center gap-3 mb-3">
                  <div className="excel-pill flex-shrink-0">S</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-700 truncate">{sheet.name}</div>
                    <div className="text-[11px] text-slate-400">
                      {sheet.rows} 行 × {sheet.columns} 列
                      <span className="mx-1.5">·</span>
                      {formatRangeSourceLabel(sheet.rangeSource)}
                    </div>
                  </div>
                </div>

                {/* Range editor */}
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-[10px] text-slate-400 flex-shrink-0">打印范围</label>
                  <input
                    type="text"
                    defaultValue={sheet.printRange}
                    onBlur={(e) => handleRangeChange(sheet.name, e.target.value)}
                    className="flex-1 px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  />
                  {sheet.rangeSource === 'manual' && (
                    <button onClick={() => resetRange(sheet.name)} className="p-1 text-slate-400 hover:text-slate-600">
                      <RotateCcw size={12} />
                    </button>
                  )}
                </div>

                {/* Current plan display */}
                {plan && (
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <Check size={12} className="text-primary-500" />
                    <span>{plan.name}</span>
                    <span>·</span>
                    <span>{formatFitModeLabel(plan.fitMode)}</span>
                    <span>·</span>
                    <span>{plan.orientation === 'landscape' ? '横向' : '纵向'}</span>
                  </div>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>

      {selectedSheets.length === 0 && (
        <div className="text-center py-10 text-sm text-slate-400">
          请先在分析页面选择需要处理的 Sheet
        </div>
      )}

      {/* Save */}
      <div className="flex gap-3">
        <Button variant="ghost" onClick={() => navigate('/settings')}>
          前往打印设置
        </Button>
        <Button
          onClick={() => setShowConfirm(true)}
          className="flex-1"
          icon={<Save size={16} />}
          disabled={selectedSheets.length === 0}
        >
          {saved ? '已保存 ✓' : '保存批量设置'}
        </Button>
      </div>

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-panel p-6 max-w-sm mx-4 shadow-xl"
          >
            <h3 className="text-base font-bold text-slate-800 mb-2">确认保存</h3>
            <p className="text-sm text-slate-500 mb-5">
              已为 {selectedSheets.length} 个 Sheet 设置打印范围和方案，确认保存？
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-full text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <Button onClick={handleSave} className="flex-1">
                确认保存
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
