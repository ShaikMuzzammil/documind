'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ChevronDown, ChevronUp, Copy, CheckCheck, BarChart3, Loader2, X } from 'lucide-react';
import { toast } from '@/components/app/Toast';
import { formatBytes } from '@/lib/utils';

interface Chunk { id: string; index: number; text: string; length: number; }
interface DocInfo { id: string; name: string; chunkCount: number; }

interface Props {
  documentId:   string;
  documentName: string;
  documentSize: number;
  onClose:      () => void;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={async () => {
      await navigator.clipboard.writeText(text).catch(() => {});
      setCopied(true); setTimeout(() => setCopied(false), 1600);
      toast.success('Copied');
    }} className="p-1.5 rounded-lg text-text-muted hover:text-text-secondary hover:bg-white/5 transition-colors">
      {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export default function DocumentViewer({ documentId, documentName, documentSize, onClose }: Props) {
  const [chunks,  setChunks]  = useState<Chunk[]>([]);
  const [docInfo, setDocInfo] = useState<DocInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/documents/${documentId}/chunks`);
      const data = await res.json();
      setChunks(data.chunks ?? []);
      setDocInfo(data.document ?? null);
    } catch { toast.error('Failed to load chunks'); }
    finally { setLoading(false); }
  }, [documentId]);

  useEffect(() => { load(); }, [load]);

  const toggleExpand = (idx: number) =>
    setExpanded((p) => { const n = new Set(p); if (n.has(idx)) n.delete(idx); else n.add(idx); return n; });

  const filtered = search.trim()
    ? chunks.filter((c) => c.text.toLowerCase().includes(search.toLowerCase()))
    : chunks;

  const avgLen  = chunks.length ? Math.round(chunks.reduce((s, c) => s + c.length, 0) / chunks.length) : 0;
  const maxLen  = chunks.length ? Math.max(...chunks.map((c) => c.length)) : 0;
  const minLen  = chunks.length ? Math.min(...chunks.map((c) => c.length)) : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border shrink-0">
        <div className="w-9 h-9 rounded-xl bg-blue-600/15 border border-blue-500/25 flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{documentName}</p>
          <p className="text-xs text-text-muted">{formatBytes(documentSize)} · {chunks.length} chunks</p>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Stats bar */}
      {!loading && chunks.length > 0 && (
        <div className="flex items-center gap-4 px-5 py-3 bg-bg-secondary/30 border-b border-border/50 shrink-0">
          <BarChart3 className="w-3.5 h-3.5 text-text-muted shrink-0" />
          {[
            { label: 'Chunks',    value: chunks.length    },
            { label: 'Avg chars', value: avgLen           },
            { label: 'Min chars', value: minLen           },
            { label: 'Max chars', value: maxLen           },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-xs font-mono font-bold text-text-primary">{value.toLocaleString()}</p>
              <p className="text-[10px] text-text-muted">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="px-4 py-3 border-b border-border/50 shrink-0">
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter chunks by content…"
          className="w-full bg-bg-secondary border border-border rounded-xl px-4 py-2 text-sm placeholder:text-text-muted focus:outline-none focus:border-blue-500/40 transition" />
      </div>

      {/* Chunks list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {loading && (
          <div className="flex justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <p className="text-center text-sm text-text-muted py-8">
            {search ? 'No chunks match your filter' : 'No chunks found'}
          </p>
        )}
        {filtered.map((chunk) => {
          const isOpen = expanded.has(chunk.index);
          return (
            <div key={chunk.id} className="rounded-xl border border-border bg-bg-card overflow-hidden">
              <button onClick={() => toggleExpand(chunk.index)}
                className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-bg-hover/50 transition-colors">
                <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded px-1.5 py-0.5 shrink-0">
                  #{chunk.index + 1}
                </span>
                <p className="flex-1 text-xs text-text-secondary truncate">{chunk.text.slice(0, 80)}…</p>
                <span className="text-[10px] font-mono text-text-muted shrink-0">{chunk.length} ch</span>
                {isOpen
                  ? <ChevronUp className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  : <ChevronDown className="w-3.5 h-3.5 text-text-muted shrink-0" />}
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                    <div className="px-4 pb-3 border-t border-border/50 pt-2">
                      <div className="flex justify-end mb-1.5">
                        <CopyBtn text={chunk.text} />
                      </div>
                      <p className="text-xs text-text-secondary font-mono leading-relaxed whitespace-pre-wrap">{chunk.text}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
