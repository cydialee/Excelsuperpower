import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Settings2 } from 'lucide-react';
import PlanCard from '@/components/ui/PlanCard';
import Button from '@/components/ui/Button';
import { useSession } from '@/context/SessionContext';
import { PLAN_LIBRARY, PLAN_ENHANCED } from '@/lib/plans';

const FILTERS = ['推荐优先', '分页可信', '省纸优先', '手动控制'];

export default function Plans() {
  const navigate = useNavigate();
  const { state, dispatch } = useSession();
  const [activeFilter, setActiveFilter] = useState(0);

  const selectedSheets = state.sheets.filter((s) => state.selectedSheetIds.includes(s.name));
  const sheetInfo = selectedSheets.length > 0
    ? { rows: selectedSheets[0].rows, columns: selectedSheets[0].columns }
    : undefined;

  const handleSelect = (planId: string) => {
    dispatch({ type: 'SET_PLAN', payload: planId });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Back */}
      <button onClick={() => navigate('/report')} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors">
        <ArrowLeft size={16} />
        返回分析报告
      </button>

      {/* Header */}
      <div>
        <div className="section-kicker mb-2">Print Plans</div>
        <h1 className="text-xl font-extrabold text-slate-800">打印方案推荐</h1>
        <p className="text-sm text-slate-500 mt-1">为所选 Sheet 挑选最佳打印方案</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f, i) => (
          <button
            key={f}
            onClick={() => setActiveFilter(i)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              i === activeFilter
                ? 'bg-primary-600 text-white shadow-primary'
                : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Plan Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {PLAN_ENHANCED.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <PlanCard
              plan={plan}
              selected={state.currentPlanId === plan.id}
              sheetInfo={sheetInfo}
              onClick={() => handleSelect(plan.id)}
            />
          </motion.div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="ghost" onClick={() => navigate('/settings')} icon={<Settings2 size={16} />}>
          打印设置
        </Button>
        <Button
          onClick={() => navigate(`/compare/${state.currentPlanId}`)}
          icon={<ArrowRight size={16} />}
          className="flex-1"
        >
          查看分页预览
        </Button>
      </div>
    </motion.div>
  );
}
