'use client';

interface Props {
  value:    number;   // 0–100
  max?:     number;
  label?:   string;
  sublabel?:string;
  color?:   'blue' | 'emerald' | 'amber' | 'red';
  size?:    'sm' | 'md' | 'lg';
  animated?:boolean;
  showPct?: boolean;
}

const COLOR_MAP = {
  blue:    'bg-blue-500',
  emerald: 'bg-emerald-500',
  amber:   'bg-amber-500',
  red:     'bg-red-500',
};

const HEIGHT_MAP = { sm: 'h-1', md: 'h-2', lg: 'h-3' };

export default function ProgressBar({
  value, max = 100, label, sublabel,
  color = 'blue', size = 'md', animated = false, showPct = false,
}: Props) {
  const pct   = Math.min(Math.max((value / max) * 100, 0), 100);
  const barC  = COLOR_MAP[color];
  const barH  = HEIGHT_MAP[size];

  return (
    <div className="w-full">
      {(label || showPct) && (
        <div className="flex items-center justify-between mb-1.5">
          {label   && <span className="text-xs font-medium text-text-secondary">{label}</span>}
          {sublabel && <span className="text-[10px] text-text-muted">{sublabel}</span>}
          {showPct && <span className="text-xs font-mono text-text-muted">{Math.round(pct)}%</span>}
        </div>
      )}
      <div className={`w-full rounded-full bg-white/8 overflow-hidden ${barH}`}>
        <div
          className={`${barH} rounded-full transition-all duration-500 ${barC} ${animated ? 'animate-pulse' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
