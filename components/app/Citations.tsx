'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Quote, ChevronDown } from 'lucide-react';
import { Citation } from '@/lib/types';

export default function Citations({ citations }: { citations: Citation[] }) {
  const [open, setOpen] = useState(false);
  if (!citations.length) return null;

  return (
    <div className="mt-3 border-t border-border pt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
      >
        <Quote className="w-3.5 h-3.5" />
        {citations.length} source{citations.length > 1 ? 's' : ''}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-2 mt-2"
          >
            {citations.map((c, i) => (
              <div key={c.chunkId} className="rounded-lg bg-bg-secondary/60 border border-border p-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-mono text-accent">[{i + 1}] {c.documentName}</span>
                  <span className="text-[10px] text-text-muted">score {c.score.toFixed(3)}</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed line-clamp-4">{c.text}</p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
