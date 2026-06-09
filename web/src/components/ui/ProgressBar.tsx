interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  showValue?: boolean;
  animated?: boolean;
}

export default function ProgressBar({ value, label, showValue = true, animated = true }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-xs text-slate-500 font-medium">{label}</span>}
          {showValue && <span className="text-xs text-slate-400 tabular-nums">{clamped}%</span>}
        </div>
      )}
      <div className="progress-track">
        <div
          className={`progress-fill ${animated ? 'animate-progress' : ''}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
