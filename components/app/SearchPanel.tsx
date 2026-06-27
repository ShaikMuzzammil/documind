'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, FileText, FolderOpen, ArrowRight, Loader2, Keyboard } from 'lucide-react';
import { useDebounce } from '@/lib/hooks/useDebounce';
import Link from 'next/link';

interface Result {
  documentId:     string;
  documentName:   string;
  collectionName: string;
  snippet:        string;
  score:          number;
  type:           'semantic' | 'keyword';
}

interface Props {
  open:    boolean;
  onClose: () => void;
}

export default function SearchPanel({ open, onClose }: Props) {
  const [query,    setQuery]    = useState('');
  const [results,  setResults]  = useState<Result[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [selected, setSelected] = useState(0);
  const [mode,     setMode]     = useState<'hybrid'|'semantic'|'keyword'>('hybrid');
  const inputRef = useRef<HTMLInputElement>(null);
  const debounced = useDebounce(query, 280);

  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 60); setQuery(''); setResults([]); }
  }, [open]);

  useEffect(() => {
    if (!debounced.trim() || !open) { setResults([]); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res  = await fetch(`/api/search?q=${encodeURIComponent(debounced)}&mode=${mode}&topK=8`);
        const data = await res.json();
        if (!cancelled) { setResults(data.results ?? []); setSelected(0); }
      } catch { /**/ }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [debounced, mode, open]);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'Escape')     { onClose(); return; }
    if (e.key === 'ArrowDown')  { e.preventDefault(); setSelected((p) => Math.min(p + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')    { e.preventDefault(); setSelected((p) => Math.max(p - 1, 0)); }
  }, [open, onClose, results.length]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  function highlightSnippet(snippet: string, q: string) {
    if (!q) return snippet;
    const words  = q.split(/\s+/).filter((w) => w.length > 2);
    let   result = snippet;
    for (const w of words) {
      result = result.replace(new RegExp(`(${w})`, 'gi'), '<mark>$1</mark>');
    }
    return result;
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -20 }}
            animate={{ opacity: 1,  scale: 1,    y: 0    }}
            exit={{    opacity: 0,  scale: 0.96, y: -20  }}
            transition={{ duration: 0.18 }}
            className="fixed top-[10vh] left-1/2 -translate-x-1/2 z-[101] w-full max-w-2xl mx-4"
          >
            <div className="glass rounded-2xl border border-border shadow-2xl overflow-hidden">
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
                {loading
                  ? <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
                  : <Search className="w-4 h-4 text-text-muted shrink-0" />
                }
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search across all documents…"
                  className="flex-1 bg-transparent text-sm placeholder:text-text-muted focus:outline-none"
                />
                <div className="flex items-center gap-1.5">
                  {(['hybrid','semantic','keyword'] as const).map((m) => (
                    <button key={m} onClick={() => setMode(m)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                        mode === m ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-text-muted hover:text-text-secondary'
                      }`}>
                      {m}
                    </button>
                  ))}
                  <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Results */}
              <div className="max-h-[60vh] overflow-y-auto">
                {results.length === 0 && query.length > 1 && !loading && (
                  <div className="py-10 text-center text-sm text-text-muted">
                    No results found for <span className="text-text-primary">&quot;{query}&quot;</span>
                  </div>
                )}

                {results.length === 0 && !query && (
                  <div className="py-8 text-center">
                    <Keyboard className="w-6 h-6 text-text-muted mx-auto mb-2" />
                    <p className="text-sm text-text-muted">Start typing to search across all indexed documents</p>
                    <p className="text-xs text-text-muted mt-1">↑ ↓ navigate · Enter open · Esc close</p>
                  </div>
                )}

                {results.map((r, i) => (
                  <Link key={`${r.documentId}-${i}`} href={`/chat?document=${r.documentId}`}
                    onClick={onClose}
                    className={`flex items-start gap-3 px-4 py-3.5 border-b border-border/50 last:border-b-0 transition-colors ${
                      selected === i ? 'bg-blue-500/8' : 'hover:bg-white/3'
                    }`}>
                    <div className="w-8 h-8 rounded-lg bg-blue-600/12 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium text-text-primary truncate">{r.documentName}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 ${
                          r.type === 'semantic' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>{r.type}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <FolderOpen className="w-3 h-3 text-text-muted shrink-0" />
                        <p className="text-xs text-text-muted truncate">{r.collectionName}</p>
                        <span className="text-[10px] text-text-muted font-mono ml-auto shrink-0">
                          {Math.round(r.score * 100)}%
                        </span>
                      </div>
                      <p
                        className="text-xs text-text-secondary line-clamp-2 leading-relaxed [&_mark]:bg-blue-500/20 [&_mark]:text-blue-300 [&_mark]:rounded-sm [&_mark]:px-0.5"
                        dangerouslySetInnerHTML={{ __html: highlightSnippet(r.snippet, query) }}
                      />
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-text-muted shrink-0 mt-1" />
                  </Link>
                ))}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-border bg-bg-secondary/30 flex items-center justify-between">
                <p className="text-[10px] text-text-muted">
                  {results.length > 0 ? `${results.length} result${results.length !== 1 ? 's' : ''}` : 'Ready'}
                </p>
                <p className="text-[10px] text-text-muted font-mono">⌘K to open · Esc to close</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
