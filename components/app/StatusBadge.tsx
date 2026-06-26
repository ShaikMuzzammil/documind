interface Props {
  status: 'ready' | 'processing' | 'error' | 'pending' | 'active' | 'inactive' | string;
  label?: string;
  pulse?: boolean;
}

const STYLES: Record<string, string> = {
  ready:      'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  active:     'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  processing: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
  pending:    'text-amber-400 border-amber-500/30 bg-amber-500/10',
  error:      'text-red-400 border-red-500/30 bg-red-500/10',
  inactive:   'text-text-muted border-border bg-bg-secondary',
};

export default function StatusBadge({ status, label, pulse = false }: Props) {
  const style = STYLES[status] ?? STYLES.inactive;
  const text  = label ?? status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full border ${style}`}>
      <span className={`w-1.5 h-1.5 rounded-full bg-current ${pulse && status === 'processing' ? 'animate-pulse' : ''}`} />
      {text}
    </span>
  );
}
