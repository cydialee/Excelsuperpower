import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Target, Rows3, Heading1, Layers } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useSession } from '@/context/SessionContext';

const OPPORTUNITY_ICONS = {
  range: Target,
  columns: Rows3,
  header: Heading1,
  batch: Layers,
};

export default function Report() {
  const navigate = useNavigate();
  const { state } = useSession();

  if (state.sheets.length === 0) {
    navigate('/');
    return null;
  }

  const selectedSheets = state.sheets.filter((s) => state.selectedSheetIds.includes(s.name));
  const sheetCount = selectedSheets.length || 1;
  const manualCount = selectedSheets.filter((s) => s.rangeSource === 'manual').length;
  const wideCount = selectedSheets.filter((s) => s.columns >= 10).length;
  const score = Math.max(62, 90 - manualCount * 6 - wideCount * 4);

  const opportunities = [
    { id: 'range', label: '打印区域', count: `${manualCount || 1} 处需确认`, icon: 'range' as const },
    { id: 'columns', label: '宽表方向', count: `${wideCount || 1} 个待优化`, icon: 'columns' as const },
    { id: 'header', label: '重复表头', count: `${sheetCount} 个建议开启`, icon: 'header' as const },
    { id: 'batch', label: '批量统一性', count: `${sheetCount} 个可独立设置`, icon: 'batch' as const },
  ];

  const getScoreColor = (s: number) => {
    if (s >= 90) return 'text-emerald-600';
    if (s >= 75) return 'text-primary-600';
    if (s >= 60) return 'text-amber-500';
    return 'text-red-500';
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
        <div className="section-kicker mb-2">Insight Map</div>
        <h1 className="text-xl font-extrabold text-slate-800">AI 分析地图</h1>
        <p className="text-sm text-slate-500 mt-1">
          {state.filename} · 已为 {sheetCount} 个 Sheet 识别打印风险
        </p>
      </div>

      {/* Score card */}
      <Card padding="lg" className="text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-50/30 to-transparent" />
        <div className="relative z-10">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Print Health Score</div>
          <div className={`text-6xl font-black ${getScoreColor(score)}`}>{score}</div>
          <div className="text-sm text-slate-500 mt-1">打印健康评分</div>
          <div className="flex justify-center gap-1 mt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-6 rounded-sm ${i < Math.ceil(score / 20) ? 'bg-amber-400' : 'bg-slate-100'}`}
              />
            ))}
          </div>
        </div>
      </Card>

      {/* Opportunities */}
      <div className="grid grid-cols-2 gap-3">
        {opportunities.map((opp) => {
          const Icon = OPPORTUNITY_ICONS[opp.icon];
          return (
            <Card key={opp.id} padding="md" hover>
              <div className="flex items-center gap-2 mb-1">
                <Icon size={16} className="text-primary-500" />
                <span className="text-xs font-semibold text-slate-700">{opp.label}</span>
              </div>
              <div className="text-[11px] text-slate-400">{opp.count}</div>
            </Card>
          );
        })}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-card bg-primary-50 text-center">
          <div className="text-lg font-extrabold text-primary-600">{sheetCount}</div>
          <div className="text-[10px] text-slate-400">已选 Sheet</div>
        </div>
        <div className="p-4 rounded-card bg-amber-50 text-center">
          <div className="text-lg font-extrabold text-amber-600">{manualCount}</div>
          <div className="text-[10px] text-slate-400">人工选区</div>
        </div>
        <div className="p-4 rounded-card bg-emerald-50 text-center">
          <div className="text-lg font-extrabold text-emerald-600">{Math.max(2, sheetCount * 2)} 页</div>
          <div className="text-[10px] text-slate-400">预计节省</div>
        </div>
      </div>

      {/* CTA */}
      <Button
        onClick={() => navigate('/plans')}
        className="w-full"
        size="lg"
        icon={<ArrowRight size={18} />}
      >
        查看优化方案
      </Button>
    </motion.div>
  );
}
