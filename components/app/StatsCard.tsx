import { type LucideIcon } from 'lucide-react';

interface Props {
  icon:    LucideIcon;
  label:   string;
  value:   string | number;
  sub?:    string;
  trend?:  { value: number; label: string };
  color?:  'blue' | 'emerald' | 'amber' | 'red' | 'purple';
  onClick?:() => void;
}

const COLOR_MAP = {
  blue:    { icon: 'text-blue-400 bg-blue-500/10 border-blue-500/25',    trend: 'text-blue-400'    },
  emerald: { icon: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25', trend: 'text-emerald-400' },
  amber:   { icon: 'text-amber-400 bg-amber-500/10 border-amber-500/25',  trend: 'text-amber-400'   },
  red:     { icon: 'text-red-400 bg-red-500/10 border-red-500/25',        trend: 'text-red-400'     },
  purple:  { icon: 'text-purple-400 bg-purple-500/10 border-purple-500/25', trend: 'text-purple-400' },
};

export default function StatsCard({
  icon: Icon, label, value, sub, trend, color = 'blue', onClick,
}: Props) {
  const colors = COLOR_MAP[color];
  const El     = onClick ? 'button' : 'div';

  return (
    <El
      onClick={onClick}
      className={`glass rounded-2xl p-5 card-glow text-left w-full ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3 ${colors.icon}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      <p className="text-sm font-medium text-text-secondary mt-0.5">{label}</p>
      {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
      {trend && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${colors.trend}`}>
          <span>{trend.value > 0 ? '↑' : '↓'}</span>
          <span>{Math.abs(trend.value)}% {trend.label}</span>
        </div>
      )}
    </El>
  );
}
