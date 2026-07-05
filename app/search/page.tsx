'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  FileText, Loader2, Search, MessageSquare, Copy, Check,
  X, Sparkles, Clock, TrendingUp, ChevronDown, ChevronUp,
} from 'lucide-react';
import AuthGate from '@/components/app/AuthGate';
import { Citation } from '@/lib/types';

const EXAMPLE_QUERIES = [
  'payment obligations and terms',
  'project deadlines and milestones',
  'data privacy requirements',
  'technical architecture overview',
  'risks and open questions',
  'key findings and conclusions',
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Citation[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    // Load recent searches from sessionStorage
    try {
      const saved = sessionStorage.getItem('dm_recent_searches');
      if (saved) setRecentSearches(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  const saveRecentSearches = (searches: string[]) => {
    try { sessionStorage.setItem('dm_recent_searches', JSON.stringify(searches)); } catch { /* ignore */ }
  };

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
      setRecentSearches(prev => {
        const updated = [q, ...prev.filter(s => s !== q)].slice(0, 8);
        saveRecentSearches(updated);
        return updated;
      });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (timerRef.current) clearTimeout(timerRef.current);
    doSearch(query);
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setSearched(false);
    inputRef.current?.focus();
  };

  const clearHistory = () => {
    setRecentSearches([]);
    saveRecentSearches([]);
  };

  const pct = (score: number) => Math.round(score * 100);
  const confidenceColor = (score: number) =>
    score >= 0.80 ? 'text-success bg-success/10 border-success/20' :
    score >= 0.60 ? 'text-warning bg-warning/10 border-warning/20' :
    'text-text-muted bg-bg-secondary/50 border-border';
  const barColor = (score: number) =>
    score >= 0.80 ? 'bg-success' : score >= 0.60 ? 'bg-warning' : 'bg-text-muted';

  return (
    <AuthGate>
      <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8 pb-24 lg:pb-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <p className="text-xs font-mono font-bold tracking-widest text-text-muted">WORKSPACE</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Semantic Search</h1>
            <p className="mt-1 text-sm text-text-secondary">
              Find relevant passages across all your documents using meaning, not just keywords.
            </p>
          </div>

          {/* Search input */}
          <form onSubmit={handleSubmit} className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Search by meaning — 'obligations and payment terms', 'safety risks'…"
              className="w-full rounded-xl border border-border bg-bg-card py-4 pl-12 pr-12 text-sm outline-none focus:border-accent/50 transition-colors"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {loading && <Loader2 className="h-4 w-4 animate-spin text-text-muted" />}
              {query && !loading && (
                <button type="button" onClick={clearSearch} className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </form>

          {/* Recent searches */}
          {recentSearches.length > 0 && !query && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-text-muted font-medium flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> RECENT SEARCHES
                </p>
                <button onClick={clearHistory} className="text-xs text-text-muted hover:text-danger transition-colors">Clear</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map(s => (
                  <button key={s} onClick={() => { setQuery(s); doSearch(s); }}
                    className="rounded-lg border border-border bg-bg-card/60 px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:border-accent/30 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {results.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-text-muted flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span className="font-semibold text-text-secondary">{results.length}</span> passages found
                </p>
                <Link
                  href={`/chat?q=${encodeURIComponent(query)}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-accent/12 border border-accent/20 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 transition-colors"
                >
                  <Sparkles className="h-3 w-3" />
                  Ask AI about these results
                </Link>
              </div>

              {results.map((r) => {
                const isExpanded = expandedId === r.chunkId;
                return (
                  <div key={r.chunkId} className="glass rounded-xl p-4 space-y-3 hover:border-accent/20 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                          <FileText className="h-3.5 w-3.5 text-accent" />
                        </div>
                        <span className="text-sm font-semibold text-text-primary truncate">{r.documentName}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-bold rounded-full border px-2 py-0.5 ${confidenceColor(r.score)}`}>
                          {pct(r.score)}% match
                        </span>
                      </div>
                    </div>

                    {/* Relevance bar */}
                    <div className="h-0.5 w-full bg-bg-hover rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${barColor(r.score)}`}
                        style={{ width: `${pct(r.score)}%` }}
                      />
                    </div>

                    <div>
                      <p className={`text-sm text-text-secondary leading-relaxed ${!isExpanded ? 'line-clamp-3' : ''}`}>
                        {r.text}
                      </p>
                      {r.text.length > 200 && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : r.chunkId)}
                          className="mt-1 text-xs text-accent hover:underline flex items-center gap-0.5"
                        >
                          {isExpanded ? <><ChevronUp className="h-3 w-3" />Show less</> : <><ChevronDown className="h-3 w-3" />Show more</>}
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                      <span className="text-[10px] text-text-muted font-mono">Chunk #{r.index}</span>
                      <div className="ml-auto flex gap-1.5">
                        <button
                          onClick={() => copyText(r.text, r.chunkId)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg-card px-2.5 py-1 text-xs text-text-muted hover:text-text-primary transition-colors"
                        >
                          {copiedId === r.chunkId ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                          {copiedId === r.chunkId ? 'Copied!' : 'Copy'}
                        </button>
                        <Link
                          href={`/chat?q=${encodeURIComponent(r.text.slice(0, 120))}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-accent/20 bg-accent/8 px-2.5 py-1 text-xs text-accent hover:bg-accent/15 transition-colors"
                        >
                          <MessageSquare className="h-3 w-3" />
                          Ask AI
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : searched && !loading ? (
            <div className="text-center py-12 glass rounded-xl">
              <Search className="mx-auto h-10 w-10 text-text-muted mb-3 opacity-40" />
              <p className="font-semibold">No matching passages found</p>
              <p className="text-sm text-text-muted mt-1 max-w-sm mx-auto">
                Try rephrasing or a different concept. Semantic search understands meaning, so exact wording is not required.
              </p>
              <button onClick={clearSearch} className="mt-4 text-xs text-accent hover:underline">Clear search</button>
            </div>
          ) : !query ? (
            <div className="glass rounded-xl p-8 text-center">
              <Search className="mx-auto h-10 w-10 mb-4 text-text-muted opacity-30" />
              <p className="font-medium mb-1">Search across all indexed documents</p>
              <p className="text-sm text-text-muted mb-6">
                Finds semantically similar passages even when the exact words differ.
              </p>
              <p className="text-xs text-text-muted mb-3 font-medium">TRY AN EXAMPLE</p>
              <div className="grid sm:grid-cols-2 gap-2 max-w-md mx-auto text-left">
                {EXAMPLE_QUERIES.map(example => (
                  <button key={example}
                    onClick={() => { setQuery(example); doSearch(example); }}
                    className="rounded-lg border border-border bg-bg-card/50 px-3 py-2 text-xs text-text-muted hover:text-text-primary hover:border-accent/30 transition-colors text-left"
                  >
                    &ldquo;{example}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </AuthGate>
  );
}
