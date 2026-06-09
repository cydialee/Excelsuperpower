import { cn } from '@/lib/utils';

type BadgeTone = 'mint' | 'sky' | 'gold' | 'coral' | 'rose' | 'amber' | 'slate';

interface BadgeProps {
  children: string;
  tone?: BadgeTone;
  className?: string;
}

const toneClasses: Record<BadgeTone, string> = {
  mint: 'bg-primary-50 text-primary-700 border-primary-200',
  sky: 'bg-sky-50 text-sky-700 border-sky-200',
  gold: 'bg-amber-50 text-amber-700 border-amber-200',
  coral: 'bg-rose-50 text-rose-600 border-rose-200',
  rose: 'bg-rose-50 text-rose-600 border-rose-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  slate: 'bg-slate-50 text-slate-600 border-slate-200',
};

export default function Badge({ children, tone = 'mint', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
