'use client';

import { type LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface Action {
  label:  string;
  onClick?: () => void;
  href?:   string;
  variant?:'primary' | 'secondary';
}

interface Props {
  icon:     LucideIcon;
  title:    string;
  desc?:    string;
  actions?: Action[];
  compact?: boolean;
}

export default function EmptyState({ icon: Icon, title, desc, actions, compact = false }: Props) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-10 gap-3' : 'py-16 gap-4'}`}>
      <div className={`rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center ${compact ? 'w-12 h-12' : 'w-16 h-16'}`}>
        <Icon className={`text-blue-400 ${compact ? 'w-5 h-5' : 'w-7 h-7'}`} />
      </div>
      <div>
        <p className={`font-semibold text-text-primary ${compact ? 'text-sm' : 'text-base'}`}>{title}</p>
        {desc && <p className={`text-text-muted mt-1 max-w-xs ${compact ? 'text-xs' : 'text-sm'}`}>{desc}</p>}
      </div>
      {actions && actions.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {actions.map((a) => {
            const cls = `inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              a.variant === 'secondary'
                ? 'border border-border text-text-secondary hover:bg-bg-hover'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`;
            return a.href ? (
              <Link key={a.label} href={a.href} className={cls}>{a.label}</Link>
            ) : (
              <button key={a.label} onClick={a.onClick} className={cls}>{a.label}</button>
            );
          })}
        </div>
      )}
    </div>
  );
}
