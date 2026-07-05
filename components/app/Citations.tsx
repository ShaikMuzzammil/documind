'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Citation } from '@/lib/types';

export default function Citations({ citations }: { citations: Citation[] }) {
  const [open, setOpen] = useState(false);
  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-3 border-t border-border/50 pt-3">
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-xs text-text-muted hover:text-accent transition-colors w-full text-left"
      >
        <FileText className="w-3.5 h-3.5 shrink-0" />
        <span className="flex-1">{citations.length} source{citations.length !== 1 ? 's' : ''} used</span>
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }} className="space-y-2 mt-2 overflow-hidden"
          >
            {citations.map((c, i) => {
              const pct = Math.round(c.score * 100);
              const barColor = pct >= 80 ? 'bg-success' : pct >= 60 ? 'bg-warning' : 'bg-text-muted';
              return (
                <div key={c.chunkId} className="rounded-xl bg-bg-secondary/60 border border-border/60 p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-mono font-bold text-accent bg-accent/10 border border-accent/20 rounded px-1.5 py-0.5">[{i + 1}]</span>
                    <span className="text-xs font-medium truncate text-text-primary flex-1">{c.documentName}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="w-16 h-1 bg-bg-hover rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] text-text-muted font-mono">{pct}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">{c.text}</p>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
