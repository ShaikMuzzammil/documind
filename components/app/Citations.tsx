'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Quote, ChevronDown, Copy, CheckCheck, ExternalLink } from 'lucide-react';
import { Citation } from '@/lib/types';

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = score >= 0.85 ? 'bg-emerald-500' : score >= 0.7 ? 'bg-amber-500' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-[10px] font-mono tabular-nums ${score >= 0.85 ? 'text-emerald-400' : score >= 0.7 ? 'text-amber-400' : 'text-red-400'}`}>
        {score.toFixed(3)}
      </span>
    </div>
  );
}

function CopyChunk({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={async () => { try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {} }}
      className="p-1.5 rounded-md text-text-muted hover:text-text-secondary hover:bg-white/5 transition-colors" title="Copy passage">
      {copied ? <CheckCheck className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

export default function Citations({ citations }: { citations: Citation[] }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  if (!citations.length) return null;

  const toggle = (id: string) => setExpanded((p) => {
    const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  const avgScore = citations.reduce((s, c) => s + c.score, 0) / citations.length;

  return (
    <div className="mt-3 border-t border-border/60 pt-3">
      <button onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-xs text-text-muted hover:text-text-secondary transition-colors w-full">
        <Quote className="w-3.5 h-3.5 shrink-0" />
        <span className="font-medium">{citations.length} source{citations.length !== 1 ? 's' : ''}</span>
        <span className="text-[10px] font-mono bg-bg-secondary/80 px-1.5 py-0.5 rounded border border-border">
          avg {avgScore.toFixed(3)}
        </span>
        <span className="ml-auto">
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="mt-2.5 space-y-2 overflow-hidden">
            {citations.map((c, i) => {
              const isExpanded = expanded.has(c.chunkId);
              const preview = c.text.length > 180 ? c.text.slice(0, 180) + '…' : c.text;
              return (
                <div key={c.chunkId} className="rounded-xl bg-bg-secondary/60 border border-border/80 overflow-hidden">
                  <div className="flex items-start gap-2 px-3 pt-2.5 pb-2">
                    <span className="text-[10px] font-mono font-bold text-accent bg-accent-soft border border-accent/20 rounded px-1.5 py-0.5 shrink-0 mt-0.5">
                      [{i + 1}]
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-text-primary truncate">{c.documentName}</span>
                        <span className="text-[10px] text-text-muted">· chunk {c.index}</span>
                      </div>
                      <ScoreBar score={c.score} />
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <CopyChunk text={c.text} />
                      {c.text.length > 180 && (
                        <button onClick={() => toggle(c.chunkId)}
                          className="p-1.5 rounded-md text-text-muted hover:text-text-secondary hover:bg-white/5 transition-colors" title="Expand">
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="px-3 pb-2.5">
                    <p className={`text-xs text-text-secondary leading-relaxed ${!isExpanded ? 'line-clamp-3' : ''}`}>
                      {isExpanded ? c.text : preview}
                    </p>
                    {c.text.length > 180 && (
                      <button onClick={() => toggle(c.chunkId)}
                        className="mt-1 text-[10px] text-accent hover:underline">
                        {isExpanded ? 'Show less' : 'Show full passage'}
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
