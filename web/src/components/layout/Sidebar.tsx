import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Upload,
  BarChart3,
  FileCheck,
  Columns2,
  Settings2,
  Download,
  Layers,
  Library,
  User,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: '工作台' },
  { to: '/analyze', icon: Upload, label: '上传分析' },
  { to: '/report', icon: BarChart3, label: '分析报告' },
  { to: '/plans', icon: FileCheck, label: '方案推荐' },
  { to: '/compare/fit-columns', icon: Columns2, label: '对比预览' },
  { to: '/settings', icon: Settings2, label: '打印设置' },
  { to: '/result', icon: Download, label: '生成结果' },
  { to: '/batch', icon: Layers, label: '批量任务' },
  { to: '/templates', icon: Library, label: '模板库' },
  { to: '/profile', icon: User, label: '个人中心' },
];

export default function Sidebar() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-card text-sm font-medium transition-all duration-150 ${
      isActive
        ? 'bg-primary-50 text-primary-700 shadow-sm'
        : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
    }`;

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-56 xl:w-60 bg-white/80 border-r border-border backdrop-blur-sm">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
        <div className="w-9 h-9 rounded-[14px] bg-primary-600 flex items-center justify-center text-white font-bold text-lg shadow-primary flex-shrink-0">
          印
        </div>
        <div className="overflow-hidden">
          <div className="text-sm font-bold text-slate-800 truncate">Excel 打印工作台</div>
          <div className="text-[10px] text-slate-400 font-medium tracking-wide">EXCELSUPERPOWER</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} className={linkClass}>
            <item.icon size={18} strokeWidth={1.8} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center">
            <User size={14} className="text-primary-600" />
          </div>
          <div className="text-xs text-slate-500">星球居民 Lv.3</div>
        </div>
      </div>
    </aside>
  );
}
