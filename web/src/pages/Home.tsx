import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, Layers, ArrowRight, FileSpreadsheet, Printer, FileText, Zap, BarChart3, Grid3X3 } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import FileUploader from '@/components/ui/FileUploader';
import { useSession } from '@/context/SessionContext';
import { uploadFile, checkHealth } from '@/api/client';
import { PROMO_SLIDES, RECENT_FILES } from '@/lib/plans';

const HERO_WORDS = ['更清晰', '更可信', '更体面'];
const HERO_LINES = [
  '自动识别表头、打印区域与宽表分页建议',
  '让预览、设置和导出都尽量贴近 Excel 打印逻辑',
  '一键输出优化后的 Excel、PDF 和批量任务配置',
];

const FLOW_STEPS = [
  { index: '01', label: '导入文件', detail: '读取 Sheet 与现有打印区域', icon: Upload },
  { index: '02', label: '确认范围', detail: '逐个 Sheet 校对打印区和方向', icon: Grid3X3 },
  { index: '03', label: '比较方案', detail: '按列、按行、单页和紧凑模式对比', icon: BarChart3 },
  { index: '04', label: '导出结果', detail: '生成 Excel、PDF 和批量打印任务', icon: FileText },
];

const HERO_METRICS = [
  { label: '默认识别准确区', value: 'A1', tone: 'mint' as const },
  { label: '打印模式', value: '5 种', tone: 'sky' as const },
  { label: '导出结果', value: 'Excel + PDF', tone: 'gold' as const },
];

const FEATURE_CARDS = [
  {
    icon: Printer,
    eyebrow: '打印语义',
    title: '先确定有效打印区域，再做分页推荐',
    detail: '系统会优先读取 Excel 原打印区域，没有时再用自动识别范围作为默认值。',
    stat: '范围优先',
  },
  {
    icon: Zap,
    eyebrow: '分页可信',
    title: '预览结果按表头、方向和适配方式生成',
    detail: '避免把所有方案都做成同一种"伪预览"，让对比结果更接近真实打印体验。',
    stat: '分页校准',
  },
  {
    icon: Layers,
    eyebrow: '批量控制',
    title: '每个 Sheet 都能保留自己的打印方式',
    detail: '批量任务不再只是一键串行，而是支持逐个 Sheet 维护范围、方向和适配模式。',
    stat: '独立设置',
  },
];

const TONES: BadgeTone[] = ['mint', 'coral', 'sky'];
type BadgeTone = 'mint' | 'sky' | 'gold' | 'coral';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16, scale: 0.985 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export default function Home() {
  const navigate = useNavigate();
  const { dispatch } = useSession();
  const [heroIndex, setHeroIndex] = useState(0);
  const [backendOnline, setBackendOnline] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check backend health
  useEffect(() => {
    checkHealth().then(setBackendOnline).catch(() => setBackendOnline(false));
  }, []);

  // Hero word rotation
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((i) => (i + 1) % HERO_WORDS.length);
    }, 2200);
    return () => clearInterval(timer);
  }, []);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const result = await uploadFile(file);
      dispatch({
        type: 'SET_WORKBOOK',
        payload: {
          workbookId: result.workbookId,
          filename: result.filename,
          sheets: result.sheets,
          mode: 'backend',
        },
      });
      dispatch({ type: 'SET_BACKEND_ONLINE', payload: true });
      navigate('/analyze');
    } catch (err: any) {
      setError(err.message || '上传失败，请确认后端已启动');
    } finally {
      setUploading(false);
    }
  }, [dispatch, navigate]);

  const handleDemo = () => {
    // Create demo session with sample data
    const demosheets = [
      { name: '汇总表', range: 'A1:I36', autoRange: 'A1:I36', printRange: 'A1:I36', rangeSource: 'auto' as const, hasNativePrintArea: false, nativePrintArea: '', rows: 36, columns: 9, preview: [], recommendedOrientation: 'portrait' as const, hidden: false, issues: [], mergedRegions: [] },
      { name: '明细数据', range: 'A1:R240', autoRange: 'A1:R240', printRange: 'A1:R240', rangeSource: 'auto' as const, hasNativePrintArea: false, nativePrintArea: '', rows: 240, columns: 18, preview: [], recommendedOrientation: 'landscape' as const, hidden: false, issues: [], mergedRegions: [] },
      { name: '辅助说明', range: 'A1:D18', autoRange: 'A1:D18', printRange: 'A1:D18', rangeSource: 'auto' as const, hasNativePrintArea: false, nativePrintArea: '', rows: 18, columns: 4, preview: [], recommendedOrientation: 'portrait' as const, hidden: false, issues: [], mergedRegions: [] },
    ];
    dispatch({
      type: 'SET_WORKBOOK',
      payload: {
        workbookId: `demo_${Date.now()}`,
        filename: '示例销售报表.xlsx',
        sheets: demosheets,
        mode: 'demo',
      },
    });
    navigate('/analyze');
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      {/* ===== Hero Section ===== */}
      <motion.div variants={item}>
        <Card padding="lg" className="relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary-50/40 to-transparent rounded-bl-full" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-amber-50/30 to-transparent rounded-tr-full" />

          <div className="relative">
            {/* Brand row */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-[14px] bg-primary-600 flex items-center justify-center text-white font-bold text-lg shadow-primary">
                印
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800">Excel 打印工作台</div>
                <div className="text-[11px] text-slate-400">导入识别 · 区域确认 · 分页对比 · 导出结果</div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="glass-tag">AI 就绪</span>
                <div className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-300'}`} />
              </div>
            </div>

            {/* Hero copy */}
            <div className="mb-6">
              <div className="section-kicker mb-3">Excel Print Studio</div>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-800 leading-tight">
                让打印结果像正式交付，而不只是"能打出来"
              </h1>
              <p className="text-sm text-slate-500 mt-2 max-w-xl">
                从 Sheet、打印区域到分页方式，整条链路都按更接近 Excel 的逻辑来处理。
              </p>
              {/* Dynamic word */}
              <div className="flex items-center gap-2 mt-3 text-sm">
                <span className="inline-block px-3 py-1 rounded-full bg-primary-100 text-primary-700 font-bold transition-all duration-300">
                  {HERO_WORDS[heroIndex]}
                </span>
                <span className="text-slate-600 transition-all duration-300">{HERO_LINES[heroIndex]}</span>
              </div>
            </div>

            {/* Flow steps */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {FLOW_STEPS.map((step, i) => (
                <div
                  key={step.index}
                  className={`flex items-start gap-2.5 p-3 rounded-card transition-all duration-200 ${
                    i === heroIndex % FLOW_STEPS.length ? 'bg-primary-50/60' : 'bg-transparent'
                  }`}
                >
                  <step.icon size={18} className={i === heroIndex % FLOW_STEPS.length ? 'text-primary-600' : 'text-slate-300'} />
                  <div>
                    <div className="text-[11px] font-bold text-slate-400">{step.index}</div>
                    <div className="text-xs font-semibold text-slate-700">{step.label}</div>
                    <div className="text-[10px] text-slate-400">{step.detail}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Promo swiper area */}
            <div className="relative bg-gradient-to-br from-primary-500 to-primary-600 rounded-panel p-5 text-white mb-4 overflow-hidden">
              <div className="absolute top-2 right-4 text-white/15 text-8xl font-black">EXCEL</div>
              <div className="relative z-10">
                <div className="text-lg font-bold mb-1">{PROMO_SLIDES[heroIndex % 3].title}</div>
                <div className="text-sm text-white/80">{PROMO_SLIDES[heroIndex % 3].subtitle}</div>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-3">
              {HERO_METRICS.map((m) => (
                <div key={m.label} className="text-center p-2.5 rounded-card bg-white/50">
                  <div className="text-lg font-extrabold text-primary-600">{m.value}</div>
                  <div className="text-[11px] text-slate-400">{m.label}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ===== Upload Section ===== */}
      <motion.div variants={item}>
        <Card hover padding="lg" className="text-center cursor-pointer">
          <div className="section-kicker mb-3">上传入口</div>
          <h2 className="text-xl font-bold text-slate-800 mb-1">导入 Excel 表格</h2>
          <p className="text-sm text-slate-500 mb-5">支持读取真实 Sheet、现有打印区域、表头结构和分页建议。</p>

          <FileUploader onFile={handleFile} disabled={uploading} />

          {!backendOnline && (
            <p className="mt-3 text-xs text-amber-600 flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              后端未连接，将使用演示模式
            </p>
          )}

          <div className="flex items-center justify-center gap-3 mt-4">
            <Badge tone="mint">识别真实 Sheet</Badge>
            <Badge tone="sky">沿用 Excel 打印区</Badge>
            <Badge tone="gold">进入分析工作流</Badge>
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <Button variant="ghost" onClick={handleDemo} className="text-xs">
              或使用演示数据快速体验
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* ===== Feature Cards ===== */}
      <motion.div variants={item} className="grid md:grid-cols-3 gap-4">
        {FEATURE_CARDS.map((f) => (
          <Card key={f.eyebrow} padding="lg">
            <div className="flex items-center gap-2 mb-2">
              <f.icon size={16} className="text-primary-500" />
              <span className="text-[11px] font-bold text-primary-600 uppercase tracking-wider">{f.eyebrow}</span>
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">{f.title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">{f.detail}</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-primary-400 rounded-full" />
              </div>
              <span className="text-[10px] font-bold text-primary-600">{f.stat}</span>
            </div>
          </Card>
        ))}
      </motion.div>

      {/* ===== Recent Files ===== */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-700">最近任务</h2>
          <button onClick={() => navigate('/batch')} className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1">
            批量任务 <ArrowRight size={12} />
          </button>
        </div>
        <Card padding="sm">
          {RECENT_FILES.map((file, i) => (
            <div
              key={file.id}
              onClick={handleDemo}
              className="flex items-center gap-3 py-2.5 px-2 rounded-card hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <div className="excel-pill flex-shrink-0">X</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-slate-700 truncate">{file.name}</div>
                <div className="text-[11px] text-slate-400">{file.status}</div>
              </div>
              <span className="text-[11px] text-slate-400 flex-shrink-0">
                {['今天 14:30', '昨天 09:12', '05-14 16:20'][i]}
              </span>
            </div>
          ))}
        </Card>
      </motion.div>
    </motion.div>
  );
}
