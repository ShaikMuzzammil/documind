'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, ChevronDown, Copy, CheckCheck, Shield } from 'lucide-react';
import { Citation } from '@/lib/types';

function ConfidenceBar({ score }: { score: number }) {
  const pct   = Math.round(score * 100);
  const color = score >= 0.85 ? 'bg-emerald-500' : score >= 0.65 ? 'bg-blue-400' : 'bg-amber-400';
  const label = score >= 0.85 ? 'High'           : score >= 0.65 ? 'Good'        : 'Moderate';
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1 rounded-full bg-white/8 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-[10px] font-mono ${score >= 0.85 ? 'text-emerald-400' : score >= 0.65 ? 'text-blue-400' : 'text-amber-400'}`}>
        {label} · {pct}%
      </span>
    </div>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /**/ }
      }}
      className="p-1.5 rounded-md text-text-muted hover:text-text-secondary hover:bg-white/5 transition-colors"
      title="Copy passage">
      {copied ? <CheckCheck className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

export default function Citations({ citations }: { citations: Citation[] }) {
  const [open,     setOpen]     = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  if (!citations.length) return null;

  const toggle = (id: string) =>
    setExpanded((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const avgScore = citations.reduce((s, c) => s + c.score, 0) / citations.length;
  const allHigh  = citations.every((c) => c.score >= 0.8);

  return (
    <div className="mt-3 border-t border-border/50 pt-3">
      <button onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-xs text-text-muted hover:text-text-secondary transition-colors w-full group">
        <BookOpen className="w-3.5 h-3.5 shrink-0" />
        <span className="font-medium">{citations.length} source{citations.length !== 1 ? 's' : ''}</span>
        {allHigh && (
          <span className="flex items-center gap-1 text-[10px] text-emerald-400">
            <Shield className="w-3 h-3" />Verified
          </span>
        )}
        <span className="text-[10px] font-mono bg-bg-secondary/80 px-1.5 py-0.5 rounded border border-border ml-1">
          avg {Math.round(avgScore * 100)}%
        </span>
        <ChevronDown className={`w-3.5 h-3.5 ml-auto transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-2.5 space-y-2 overflow-hidden">
            {citations.map((c, i) => {
              const isExpanded = expanded.has(c.chunkId);
              return (
                <div key={c.chunkId} className="rounded-xl bg-bg-secondary/50 border border-border/70 overflow-hidden">
                  <div className="flex items-start gap-2.5 px-3 pt-2.5 pb-1.5">
                    <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded px-1.5 py-0.5 shrink-0 mt-0.5">
                      [{i + 1}]
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-text-primary truncate">{c.documentName}</p>
                      <p className="text-[10px] text-text-muted">Chunk {c.index + 1}</p>
                      <ConfidenceBar score={c.score} />
                    </div>
                    <CopyBtn text={c.text} />
                  </div>
                  <div className="px-3 pb-2.5">
                    <p className={`text-xs text-text-secondary leading-relaxed ${!isExpanded ? 'line-clamp-3' : ''}`}>
                      {c.text}
                    </p>
                    {c.text.length > 180 && (
                      <button onClick={() => toggle(c.chunkId)}
                        className="mt-1 text-[10px] text-blue-400 hover:underline">
                        {isExpanded ? 'Collapse' : 'Expand full passage'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
