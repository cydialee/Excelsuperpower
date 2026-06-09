import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, CheckCircle2, FileSpreadsheet, FileText, RotateCcw, AlertTriangle } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { useSession } from '@/context/SessionContext';
import { getDownloadUrl } from '@/api/client';

export default function Result() {
  const navigate = useNavigate();
  const { state, dispatch } = useSession();

  const job = state.jobResult;

  const handleDownload = (url: string) => {
    const fullUrl = getDownloadUrl(url);
    window.open(fullUrl, '_blank');
  };

  const handleRestart = () => {
    dispatch({ type: 'RESET' });
    navigate('/');
  };

  const getTypeIcon = (type: string) => {
    if (type === 'pdf') return <FileText size={20} className="text-rose-500" />;
    if (type === 'xlsm') return <FileSpreadsheet size={20} className="text-amber-500" />;
    return <FileSpreadsheet size={20} className="text-emerald-500" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Back */}
      <button onClick={() => navigate('/settings')} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors">
        <ArrowLeft size={16} />
        返回设置
      </button>

      {!job ? (
        <EmptyState
          icon={FileText}
          title="暂无生成任务"
          description="请先在设置页面配置打印选项并点击生成"
          action={
            <Button onClick={() => navigate('/settings')} size="sm">
              前往设置
            </Button>
          }
        />
      ) : (
        <>
          {/* Success banner */}
          <Card padding="lg" className="text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/30 to-transparent" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={30} className="text-emerald-500" />
              </div>
              <h1 className="text-xl font-extrabold text-slate-800">打印任务已准备完成</h1>
              <p className="text-sm text-slate-500 mt-1">
                {job.planName} · {job.sheetCount} 个 Sheet
              </p>
            </div>
          </Card>

          {/* Downloads */}
          <Card padding="md">
            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <Download size={16} className="text-primary-500" />
              下载文件
            </h3>
            <div className="space-y-2">
              {job.downloads.map((dl, i) => (
                <button
                  key={i}
                  onClick={() => handleDownload(dl.url)}
                  className="w-full flex items-center gap-3 p-3 rounded-card bg-slate-50 hover:bg-primary-50 hover:border-primary-200 border border-transparent transition-all text-left"
                >
                  {getTypeIcon(dl.type)}
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-700">{dl.label}</div>
                    <div className="text-[10px] text-slate-400">.{dl.type}</div>
                  </div>
                  <Download size={16} className="text-primary-500" />
                </button>
              ))}
            </div>
          </Card>

          {/* Warnings */}
          {job.warnings.length > 0 && (
            <Card padding="md" className="border-amber-200 bg-amber-50/50">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={14} className="text-amber-500" />
                <span className="text-xs font-bold text-amber-700">提示</span>
              </div>
              {job.warnings.map((w, i) => (
                <p key={i} className="text-xs text-amber-600 mb-1">{w}</p>
              ))}
            </Card>
          )}

          {/* Restart */}
          <Button variant="ghost" onClick={handleRestart} className="w-full" icon={<RotateCcw size={16} />}>
            返回重新上传
          </Button>
        </>
      )}
    </motion.div>
  );
}
