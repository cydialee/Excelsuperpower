import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, CheckCircle, AlertTriangle, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import Badge from '@/components/ui/Badge';
import SheetPreview from '@/components/ui/SheetPreview';
import EmptyState from '@/components/ui/EmptyState';
import { useSession } from '@/context/SessionContext';
import { isValidRange } from '@/lib/range';
import { formatRangeSourceLabel } from '@/lib/plans';

const ANALYSIS_MESSAGES = [
  {
    badge: '正在解析',
    title: '读取工作簿结构',
    detail: '识别 Sheet 名称、行列范围和可见性',
    focus: '工作簿元数据',
  },
  {
    badge: '检测区域',
    title: '分析打印配置',
    detail: '读取 Excel 现有打印区域与页面设置',
    focus: '打印区域优先级',
  },
  {
    badge: '检查风险',
    title: '诊断打印问题',
    detail: '检测宽表、合并单元格、公式缓存缺失等风险',
    focus: '兼容性检查',
  },
];

export default function Analyze() {
  const navigate = useNavigate();
  const { state, dispatch } = useSession();
  const [progress, setProgress] = useState(12);
  const [ready, setReady] = useState(false);
  const [analysisIndex, setAnalysisIndex] = useState(0);
  const [msg] = useState(ANALYSIS_MESSAGES[0]);

  // Simulate analysis progress
  useEffect(() => {
    if (state.sheets.length === 0) {
      navigate('/');
      return;
    }

    if (ready) return;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.random() * 12 + 4;
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(() => setReady(true), 400);
          return 100;
        }
        return Math.min(next, 99);
      });
    }, 480);

    return () => clearInterval(timer);
  }, [state.sheets.length, ready, navigate]);

  // Rotate analysis messages
  useEffect(() => {
    if (ready) return;
    const timer = setInterval(() => {
      setAnalysisIndex((i) => (i + 1) % ANALYSIS_MESSAGES.length);
    }, 2200);
    return () => clearInterval(timer);
  }, [ready]);

  const currentMsg = ANALYSIS_MESSAGES[analysisIndex];

  const toggleSheet = (name: string) => {
    dispatch({ type: 'TOGGLE_SHEET', payload: name });
  };

  const handleRangeChange = (sheetName: string, value: string) => {
    if (isValidRange(value)) {
      dispatch({ type: 'SET_SHEET_RANGE', payload: { sheetId: sheetName, range: value } });
    }
  };

  const resetRange = (sheetName: string) => {
    dispatch({ type: 'RESET_SHEET_RANGE', payload: sheetName });
  };

  const selectedCount = state.selectedSheetIds.length;
  const manualCount = state.sheets.filter((s) => s.rangeSource === 'manual').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Back link */}
      <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors">
        <ArrowLeft size={16} />
        返回工作台
      </button>

      {/* Header */}
      <div>
        <div className="section-kicker mb-2">Sheet Analysis</div>
        <h1 className="text-xl font-extrabold text-slate-800">上传分析</h1>
        <p className="text-sm text-slate-500 mt-1">
          {state.filename} · {state.sheets.length} 个 Sheet
        </p>
      </div>

      {/* Analysis in progress */}
      <AnimatePresence>
        {!ready ? (
          <motion.div key="progress" exit={{ opacity: 0, y: -10 }}>
            <Card padding="lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                  <Search size={20} className="text-primary-600 animate-pulse" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-700">{currentMsg.title}</div>
                  <div className="text-xs text-slate-400">{currentMsg.detail}</div>
                </div>
                <Badge tone="mint" className="ml-auto">{currentMsg.badge}</Badge>
              </div>

              <ProgressBar value={progress} label="解析进度" />

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-[11px] text-slate-400">
                  <CheckCircle size={12} className="inline mr-1 text-emerald-400" />
                  {progress > 30 ? '工作簿内容已读取' : '正在读取工作簿内容...'}
                </span>
                <span className="text-[11px] text-slate-400">
                  <CheckCircle size={12} className={`inline mr-1 ${progress > 60 ? 'text-emerald-400' : 'text-slate-200'}`} />
                  {progress > 60 ? 'Sheet 范围已识别' : '识别有效 Sheet...'}
                </span>
                <span className="text-[11px] text-slate-400">
                  <CheckCircle size={12} className={`inline mr-1 ${progress > 85 ? 'text-emerald-400' : 'text-slate-200'}`} />
                  {progress > 85 ? '打印风险已标记' : '诊断打印风险...'}
                </span>
              </div>
            </Card>

            {/* Analysis stage visualization */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              {ANALYSIS_MESSAGES.map((m, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-card text-center transition-all duration-300 ${
                    i <= analysisIndex ? 'bg-primary-50 border border-primary-200' : 'bg-white/40 border border-slate-100'
                  }`}
                >
                  <div className={`text-[11px] font-bold mb-0.5 ${i <= analysisIndex ? 'text-primary-600' : 'text-slate-400'}`}>
                    {m.focus}
                  </div>
                  <div className={`text-[10px] ${i <= analysisIndex ? 'text-primary-500' : 'text-slate-300'}`}>
                    {i < analysisIndex ? '已完成' : i === analysisIndex ? '处理中...' : '等待中'}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          /* Analysis complete - Sheet list */
          <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 grid grid-cols-3 gap-3">
                <div className="p-3 rounded-card bg-primary-50 text-center">
                  <div className="text-lg font-extrabold text-primary-600">{state.sheets.length}</div>
                  <div className="text-[10px] text-slate-400">识别 Sheet</div>
                </div>
                <div className="p-3 rounded-card bg-amber-50 text-center">
                  <div className="text-lg font-extrabold text-amber-600">{manualCount}</div>
                  <div className="text-[10px] text-slate-400">人工选区</div>
                </div>
                <div className="p-3 rounded-card bg-white/50 text-center">
                  <div className="text-lg font-extrabold text-slate-700">{selectedCount}</div>
                  <div className="text-[10px] text-slate-400">已选择</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {state.sheets.map((sheet) => {
                const isSelected = state.selectedSheetIds.includes(sheet.name);
                const hasIssues = sheet.issues.length > 0;

                return (
                  <Card key={sheet.name} padding="md">
                    {/* Sheet header */}
                    <div className="flex items-center gap-3 mb-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSheet(sheet.name)}
                          className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-400"
                        />
                        <div>
                          <span className="text-sm font-bold text-slate-700">{sheet.name}</span>
                          <span className="ml-2 text-[11px] text-slate-400">
                            {sheet.rows} 行 × {sheet.columns} 列
                          </span>
                        </div>
                      </label>
                      <Badge tone={sheet.rangeSource === 'excel' ? 'mint' : sheet.rangeSource === 'manual' ? 'amber' : 'slate'}>
                        {formatRangeSourceLabel(sheet.rangeSource)}
                      </Badge>
                      {hasIssues && (
                        <AlertTriangle size={14} className="text-amber-500 ml-auto" />
                      )}
                    </div>

                    {/* Range editor */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[11px] text-slate-400 font-mono">打印范围:</span>
                      <input
                        type="text"
                        defaultValue={sheet.printRange}
                        onBlur={(e) => handleRangeChange(sheet.name, e.target.value)}
                        className="flex-1 px-2.5 py-1 text-xs font-mono border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent bg-white"
                        placeholder="A1:Z100"
                      />
                      {sheet.rangeSource === 'manual' && (
                        <button
                          onClick={() => resetRange(sheet.name)}
                          className="p-1 text-slate-400 hover:text-slate-600"
                          title="重置为自动检测"
                        >
                          <RotateCcw size={12} />
                        </button>
                      )}
                    </div>

                    {/* Issues */}
                    {hasIssues && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {sheet.issues.map((issue) => (
                          <span key={issue.id} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                            {issue.label}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Data preview */}
                    <SheetPreview sheet={sheet} maxRows={6} maxCols={8} />
                  </Card>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <Button variant="ghost" onClick={() => navigate('/batch')} icon={<ArrowRight size={16} />}>
                进入批量调整
              </Button>
              <Button
                onClick={() => navigate('/report')}
                icon={<ArrowRight size={16} />}
                disabled={selectedCount === 0}
              >
                查看分析结果
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
