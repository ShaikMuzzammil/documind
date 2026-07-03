'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { FileText, Loader2, Search } from 'lucide-react';
import AuthGate from '@/components/app/AuthGate';
import { Citation } from '@/lib/types';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Citation[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json().catch(() => ({ results: [] }));
      setResults(data.results || []);
      setSearched(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (val: string) => {
    setQuery(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(val), 400);
  };

  const pct = (score: number) => Math.round(score * 100);
  const confidence = (score: number) => score >= 0.8 ? 'text-success' : score >= 0.6 ? 'text-yellow-400' : 'text-text-muted';

  return (
    <AuthGate>
      <div className="min-h-[calc(100vh-4rem)] px-4 py-6 sm:px-6 lg:px-8 pb-24 lg:pb-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <p className="text-xs font-mono font-bold tracking-widest text-text-muted">WORKSPACE</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Search</h1>
            <p className="mt-1 text-sm text-text-secondary">Find relevant passages across all your documents using semantic similarity.</p>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { if (timerRef.current) clearTimeout(timerRef.current); doSearch(query); }}}
              placeholder="Search by meaning, not keywords…"
              className="w-full rounded-xl border border-border bg-bg-card py-3.5 pl-12 pr-4 text-sm outline-none focus:border-accent/50 transition-colors"
            />
            {loading && <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-text-muted" />}
          </div>

          {results.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs text-text-muted">{results.length} passages found for &quot;{query}&quot;</p>
              {results.map((r) => (
                <div key={r.chunkId} className="glass rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-accent shrink-0" />
                    <span className="text-sm font-medium text-accent truncate">{r.documentName}</span>
                    <span className={`ml-auto text-xs font-mono shrink-0 ${confidence(r.score)}`}>
                      {pct(r.score)}% match
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed line-clamp-4">{r.text}</p>
                </div>
              ))}
            </div>
          ) : searched && !loading ? (
            <div className="text-center py-12">
              <Search className="mx-auto h-10 w-10 text-text-muted mb-3" />
              <p className="font-semibold">No matching passages found</p>
              <p className="text-sm text-text-muted mt-1">Try rephrasing or a different topic. Semantic search understands meaning, so exact wording is not required.</p>
            </div>
          ) : !query ? (
            <div className="text-center py-12 text-text-muted">
              <Search className="mx-auto h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm">Start typing to search across all your indexed documents</p>
            </div>
          ) : null}
        </div>
      </div>
    </AuthGate>
  );
}
