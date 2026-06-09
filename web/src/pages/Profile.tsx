import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Award, TrendingUp, Settings2, Clock, FileCheck, Layers, Coins, ChevronRight, Star } from 'lucide-react';
import Card from '@/components/ui/Card';

const ACHIEVEMENTS = [
  { id: 'rookie', name: '初出茅庐', desc: '完成首次打印优化', icon: Star, tone: 'blue' },
  { id: 'eco', name: '节能先锋', desc: '累计节省 100 页纸张', icon: TrendingUp, tone: 'gold' },
  { id: 'master', name: '效率大师', desc: '批量处理 10 个文件', icon: Award, tone: 'rose' },
] as const;

const MENU_ITEMS = [
  { label: '我的方案', count: 12, icon: FileCheck },
  { label: '我的模板', count: 8, icon: Layers },
  { label: '打印记录', count: 156, icon: Clock },
  { label: '批量任务', count: 3, icon: Layers },
  { label: '节纸报告', extra: '¥48.60', icon: Coins },
  { label: '设置中心', icon: Settings2, to: '/settings' as const },
];

const STATS = [
  { label: '本月优化', value: '28 份' },
  { label: '累计节纸', value: '316 页' },
  { label: '常用模板', value: '财务' },
];

const TONE_BORDER: Record<string, string> = {
  blue: 'border-blue-300',
  gold: 'border-amber-300',
  rose: 'border-rose-300',
};

export default function Profile() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Profile header */}
      <Card padding="lg" className="text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center mx-auto mb-3 shadow-primary">
          <User size={36} className="text-white" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Lee</h2>
        <span className="inline-block mt-1 px-3 py-0.5 rounded-full bg-primary-50 text-primary-700 text-xs font-medium">
          星球居民 Lv.3
        </span>

        {/* Energy bar */}
        <div className="mt-4 max-w-xs mx-auto">
          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
            <span>经验值</span>
            <span>1280 / 2000</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: '62%' }} />
          </div>
        </div>
      </Card>

      {/* Achievements */}
      <div>
        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
          <Award size={16} className="text-amber-500" />
          成就徽章
        </h3>
        <div className="flex gap-3">
          {ACHIEVEMENTS.map((a) => (
            <div
              key={a.id}
              className={`flex-1 p-3 rounded-card bg-white border ${TONE_BORDER[a.tone]} text-center`}
            >
              <a.icon size={18} className={`mx-auto mb-1 ${a.tone === 'blue' ? 'text-blue-500' : a.tone === 'gold' ? 'text-amber-500' : 'text-rose-500'}`} />
              <div className="text-[11px] font-bold text-slate-700">{a.name}</div>
              <div className="text-[9px] text-slate-400">{a.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {STATS.map((s) => (
          <div key={s.label} className="p-3 rounded-card bg-white/80 text-center">
            <div className="text-base font-extrabold text-slate-700">{s.value}</div>
            <div className="text-[10px] text-slate-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Menu */}
      <Card padding="sm">
        {MENU_ITEMS.map((item) => (
          <div
            key={item.label}
            onClick={() => item.to && navigate(item.to)}
            className={`flex items-center gap-3 py-3 px-2 ${item.to ? 'cursor-pointer hover:bg-slate-50' : ''} rounded-card transition-colors`}
          >
            <item.icon size={16} className="text-slate-400" />
            <span className="flex-1 text-sm text-slate-600">{item.label}</span>
            {item.count !== undefined && (
              <span className="text-xs text-slate-400">{item.count}</span>
            )}
            {item.extra && (
              <span className="text-xs font-semibold text-primary-600">{item.extra}</span>
            )}
            {item.to && <ChevronRight size={14} className="text-slate-300" />}
          </div>
        ))}
      </Card>
    </motion.div>
  );
}
