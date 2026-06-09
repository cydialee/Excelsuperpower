import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Plus, FileSpreadsheet } from 'lucide-react';
import Card from '@/components/ui/Card';
import { TEMPLATE_DATA, TEMPLATE_CATEGORIES } from '@/lib/plans';

const TONE_BG: Record<string, string> = {
  emerald: 'bg-emerald-100 text-emerald-700',
  blue: 'bg-blue-100 text-blue-700',
  amber: 'bg-amber-100 text-amber-700',
  rose: 'bg-rose-100 text-rose-700',
  violet: 'bg-violet-100 text-violet-700',
  cyan: 'bg-cyan-100 text-cyan-700',
  orange: 'bg-orange-100 text-orange-700',
  pink: 'bg-pink-100 text-pink-700',
};

export default function Templates() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState(0);

  const filtered = activeCategory === 0
    ? TEMPLATE_DATA
    : TEMPLATE_DATA.filter((t) => t.category === TEMPLATE_CATEGORIES[activeCategory]);

  const handleUseTemplate = (templateId: string) => {
    navigate('/settings');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <div className="section-kicker mb-2">Template Library</div>
        <h1 className="text-xl font-extrabold text-slate-800">模板乐园</h1>
        <p className="text-sm text-slate-500 mt-1">选择常用模板快速开始</p>
      </div>

      {/* Search bar (visual) */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
        <input
          type="text"
          placeholder="搜索模板..."
          className="w-full pl-10 pr-4 py-2.5 rounded-full border border-slate-200 bg-white text-sm text-slate-600 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TEMPLATE_CATEGORIES.map((cat, i) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(i)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              i === activeCategory
                ? 'bg-primary-600 text-white shadow-primary'
                : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map((tpl, i) => (
          <motion.div
            key={tpl.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card hover padding="sm" onClick={() => handleUseTemplate(tpl.id)}>
              {/* Preview */}
              <div className={`h-24 rounded-lg mb-3 flex items-center justify-center ${TONE_BG[tpl.tone] || 'bg-slate-100 text-slate-500'}`}>
                <FileSpreadsheet size={28} className="opacity-60" />
              </div>
              <div className="text-xs font-semibold text-slate-700 mb-0.5">{tpl.name}</div>
              <div className="text-[10px] text-slate-400">{tpl.usage.toLocaleString()} 次使用</div>
            </Card>
          </motion.div>
        ))}

        {/* Custom template card */}
        <Card hover padding="sm" className="flex flex-col items-center justify-center min-h-[180px] border-dashed">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-2">
            <Plus size={20} className="text-slate-400" />
          </div>
          <span className="text-xs text-slate-400">自定义模板</span>
        </Card>
      </div>
    </motion.div>
  );
}
