interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
}

export default function Toggle({ checked, onChange, label, hint }: ToggleProps) {
  return (
    <label className="flex items-center justify-between py-2 cursor-pointer group">
      <div>
        <span className="text-sm text-slate-700 font-medium group-hover:text-slate-900 transition-colors">
          {label}
        </span>
        {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`toggle-track ${checked ? 'on' : 'off'} focus-ring flex-shrink-0`}
      >
        <span className="toggle-thumb" />
      </button>
    </label>
  );
}
