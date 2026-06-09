import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Cog, Layers } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import SegmentedControl from '@/components/ui/SegmentedControl';
import Toggle from '@/components/ui/Toggle';
import { useSession } from '@/context/SessionContext';
import { getPlanById, PLAN_ENHANCED } from '@/lib/plans';
import { submitOptimize } from '@/api/client';

export default function Settings() {
  const navigate = useNavigate();
  const { state, dispatch } = useSession();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plan = getPlanById(state.currentPlanId);
  const enhanced = PLAN_ENHANCED.find((p) => p.id === plan.id);

  const settings = state.settings;

  const handleSave = async () => {
    setError(null);

    if (state.mode === 'backend' && state.workbookId) {
      setGenerating(true);
      try {
        const targets = state.sheets
          .filter((s) => state.selectedSheetIds.includes(s.name))
          .map((s) => ({
            sheet: s.name,
            range: s.printRange,
            rangeSource: s.rangeSource,
          }));

        const result = await submitOptimize(
          state.workbookId,
          targets,
          state.currentPlanId
        );

        dispatch({
          type: 'SET_JOB_RESULT',
          payload: {
            downloads: result.downloads,
            warnings: result.warnings || [],
            planName: plan.name,
            sheetCount: result.preview?.selectedSheetCount || state.selectedSheetIds.length,
          },
        });

        navigate('/result');
      } catch (err: any) {
        setError(err.message || '生成失败');
      } finally {
        setGenerating(false);
      }
    } else {
      // Demo mode - create fake job result
      dispatch({
        type: 'SET_JOB_RESULT',
        payload: {
          downloads: [
            { type: 'xlsx' as const, label: '优化 Excel', url: '/outputs/demo/demo-optimized.xlsx' },
            { type: 'pdf' as const, label: '可打印 PDF', url: '/outputs/demo/demo-print.pdf' },
          ],
          warnings: [],
          planName: plan.name,
          sheetCount: state.selectedSheetIds.length,
        },
      });
      navigate('/result');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors">
        <ArrowLeft size={16} />
        返回
      </button>

      {/* Header */}
      <div>
        <div className="section-kicker mb-2">Print Settings</div>
        <h1 className="text-xl font-extrabold text-slate-800">打印设置</h1>
        <p className="text-sm text-slate-500 mt-1">调整方案后生成最终文件</p>
      </div>

      {/* Current plan */}
      {enhanced && (
        <Card padding="md" className="bg-primary-50/50 border-primary-200">
          <div className="flex items-center gap-2 mb-1">
            <Cog size={14} className="text-primary-500" />
            <span className="text-[11px] font-bold text-primary-600">当前方案</span>
          </div>
          <div className="text-sm font-bold text-slate-800">{enhanced.label} · {plan.name}</div>
          <p className="text-xs text-slate-500 mt-0.5">{plan.description}</p>
        </Card>
      )}

      {/* Paper & Orientation */}
      <Card padding="md">
        <h3 className="text-sm font-bold text-slate-700 mb-3">纸张与方向</h3>

        <div className="mb-4">
          <div className="text-xs text-slate-500 mb-2">打印方向</div>
          <SegmentedControl
            options={[
              { value: 'portrait' as const, label: '纵向' },
              { value: 'landscape' as const, label: '横向' },
            ]}
            value={settings.orientation}
            onChange={(v) => dispatch({ type: 'UPDATE_SETTINGS', payload: { orientation: v } })}
          />
        </div>

        <div className="mb-4">
          <div className="text-xs text-slate-500 mb-2">纸张大小</div>
          <SegmentedControl
            options={[
              { value: 'A4', label: 'A4' },
              { value: 'A3', label: 'A3' },
              { value: 'Letter', label: 'Letter' },
            ]}
            value={settings.paper}
            onChange={(v) => dispatch({ type: 'UPDATE_SETTINGS', payload: { paper: v } })}
          />
        </div>
      </Card>

      {/* Fit mode */}
      <Card padding="md">
        <h3 className="text-sm font-bold text-slate-700 mb-3">适配模式</h3>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { value: 'fitColumns' as const, label: '按列适配', hint: '宽度一页' },
            { value: 'fitRows' as const, label: '按行适配', hint: '高度一页' },
            { value: 'singlePage' as const, label: '整表单页', hint: '全部一页' },
          ].map((mode) => (
            <button
              key={mode.value}
              onClick={() => dispatch({ type: 'UPDATE_SETTINGS', payload: { fitMode: mode.value } })}
              className={`p-3 rounded-card text-center transition-all ${
                settings.fitMode === mode.value
                  ? 'bg-primary-50 border-2 border-primary-400'
                  : 'bg-white border border-slate-100 hover:border-slate-200'
              }`}
            >
              <div className="text-xs font-bold text-slate-700">{mode.label}</div>
              <div className="text-[10px] text-slate-400">{mode.hint}</div>
            </button>
          ))}
        </div>

        <div className="mb-4">
          <div className="text-xs text-slate-500 mb-2">页边距</div>
          <SegmentedControl
            options={[
              { value: 'normal' as const, label: '标准' },
              { value: 'compact' as const, label: '紧凑' },
            ]}
            value={settings.margin}
            onChange={(v) => dispatch({ type: 'UPDATE_SETTINGS', payload: { margin: v, marginPreset: v } })}
          />
        </div>
      </Card>

      {/* Toggles */}
      <Card padding="md">
        <h3 className="text-sm font-bold text-slate-700 mb-1">打印选项</h3>
        <div className="divide-y divide-slate-50">
          <Toggle
            label="重复打印表头"
            hint="每页顶部重复打印标题行"
            checked={settings.repeatHeader}
            onChange={(v) => dispatch({ type: 'UPDATE_SETTINGS', payload: { repeatHeader: v } })}
          />
          <Toggle
            label="美化排版"
            hint="自动添加表头样式和隔行背景色"
            checked={settings.beautify}
            onChange={(v) => dispatch({ type: 'UPDATE_SETTINGS', payload: { beautify: v } })}
          />
          <Toggle
            label="显示网格线"
            hint="在打印输出中保留表格线"
            checked={settings.showGridLines}
            onChange={(v) => dispatch({ type: 'UPDATE_SETTINGS', payload: { showGridLines: v } })}
          />
          <Toggle
            label="长文本自动换行"
            hint="对超长内容的列开启换行"
            checked={settings.wrapLongText}
            onChange={(v) => dispatch({ type: 'UPDATE_SETTINGS', payload: { wrapLongText: v } })}
          />
        </div>
      </Card>

      {/* Actions */}
      {error && (
        <div className="p-3 rounded-card bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>
      )}

      <div className="flex gap-3">
        <Button variant="ghost" onClick={() => navigate('/batch')} icon={<Layers size={16} />}>
          批量调整
        </Button>
        <Button
          onClick={handleSave}
          loading={generating}
          className="flex-1"
          size="lg"
        >
          {state.mode === 'demo' ? '演示生成' : '保存设置并生成结果'}
        </Button>
      </div>
    </motion.div>
  );
}
