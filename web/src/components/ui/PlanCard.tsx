import { cn } from '@/lib/utils';
import { Star, Check } from 'lucide-react';
import type { PlanConfig } from '@/api/client';
import { PLAN_ENHANCED, estimatePages } from '@/lib/plans';
import Card from './Card';

interface PlanCardProps {
  plan: PlanConfig;
  selected?: boolean;
  sheetInfo?: { rows: number; columns: number };
  onClick?: () => void;
}

export default function PlanCard({ plan, selected = false, sheetInfo, onClick }: PlanCardProps) {
  const enhanced = PLAN_ENHANCED.find((p) => p.id === plan.id) || PLAN_ENHANCED[0];
  const pages = sheetInfo ? estimatePages(sheetInfo.rows, sheetInfo.columns, plan) : null;

  return (
    <Card
      hover
      padding="md"
      onClick={onClick}
      className={cn(
        'relative transition-all duration-200',
        selected && 'ring-2 ring-primary-400 border-primary-300 bg-primary-50/30'
      )}
    >
      {/* Recommended badge */}
      {enhanced.recommended && (
        <div className="absolute -top-2 right-4">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold border border-amber-200">
            <Star size={10} className="fill-amber-500 text-amber-500" />
            推荐
          </span>
        </div>
      )}

      {selected && (
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
          <Check size={12} className="text-white" strokeWidth={3} />
        </div>
      )}

      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="text-sm font-bold text-slate-800">{enhanced.label}</h4>
          <p className="text-xs text-slate-500 mt-0.5">{plan.name}</p>
        </div>
        <div className="text-right">
          <div className="text-base font-bold text-primary-600">{enhanced.paperUse}</div>
          <div className="text-[10px] text-slate-400">纸张利用</div>
        </div>
      </div>

      <p className="text-xs text-slate-500 leading-relaxed mb-3">{plan.description}</p>

      <div className="flex items-center gap-4 text-[11px] text-slate-400">
        <span>省纸 {enhanced.saving}</span>
        <span>{pages !== null ? `${pages} 页` : enhanced.pages}</span>
        <span>{plan.orientation === 'landscape' ? '横向' : '纵向'}</span>
      </div>

      {/* Score stars */}
      <div className="flex items-center gap-0.5 mt-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={10}
            className={i < enhanced.score ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
          />
        ))}
      </div>
    </Card>
  );
}
