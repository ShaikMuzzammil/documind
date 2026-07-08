'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Search, Loader2, FileText, Layers, MessageSquare,
  ChevronDown, ChevronUp, Sliders, X, Zap,
  Clock, BookOpen, Hash,
} from 'lucide-react';
import AuthGate from '@/components/app/AuthGate';
import { useCollections } from '@/lib/use-collections';
import { Citation } from '@/lib/types';

interface SearchResult extends Citation {
  collectionId?: string;
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 80 ? 'bg-success' : pct >= 60 ? 'bg-accent' : pct >= 40 ? 'bg-warning' : 'bg-danger';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-bg-secondary">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-[10px] font-bold ${pct >= 80 ? 'text-success' : pct >= 60 ? 'text-accent' : pct >= 40 ? 'text-warning' : 'text-danger'}`}>{pct}%</span>
    </div>
  );
}

function ResultCard({ result, query, index }: { result: SearchResult; query: string; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const highlighted = result.text.replace(
    new RegExp(`(${words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi'),
    '<mark class="bg-accent/20 text-accent rounded px-0.5">$1</mark>'
  );

  return (
    <div className="glass rounded-xl overflow-hidden hover:border-accent/20 transition-colors">
      <div className="flex items-start gap-3 p-4">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 border border-accent/20">
          <span className="text-xs font-bold text-accent">{index}</span>
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate text-text-primary">{result.documentName}</p>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[11px] text-text-muted flex items-center gap-1">
                  <Hash className="h-3 w-3" /> chunk {result.index + 1}
                </span>
                <ScoreBar score={result.score} />
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <Link
                href={`/chat?q=${encodeURIComponent(query)}&collectionId=${result.collectionId || ''}`}
                className="flex items-center gap-1 rounded-lg border border-accent/25 bg-accent/8 px-2.5 py-1 text-[11px] font-medium text-accent hover:bg-accent/15 transition-colors"
              >
                <MessageSquare className="h-3 w-3" /> Ask AI
              </Link>
              <button
                onClick={() => setExpanded(e => !e)}
                className="flex items-center gap-1 rounded-lg border border-border bg-bg-card px-2.5 py-1 text-[11px] text-text-muted hover:text-text-primary hover:border-border/80 transition-colors"
              >
                {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {expanded ? 'Less' : 'More'}
              </button>
            </div>
          </div>

          {/* Preview text */}
          <div className={`text-xs leading-relaxed text-text-secondary ${expanded ? '' : 'line-clamp-3'}`}>
            <span dangerouslySetInnerHTML={{ __html: highlighted }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  const { collections } = useCollections();
  const [query, setQuery] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [topK, setTopK] = useState(8);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('dm_search_history');
    if (stored) { try { setHistory(JSON.parse(stored)); } catch { /* ignore */ } }
    inputRef.current?.focus();
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true); setError(''); setSearched(true);
    try {
      const params = new URLSearchParams({ query: q, topK: String(topK) });
      if (collectionId) params.set('collectionId', collectionId);
      const r = await fetch(`/api/search?${params}`, { signal: abortRef.current.signal });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Search failed');
      setResults(d.results || []);
      // Save to history
      const newHistory = [q, ...history.filter(h => h !== q)].slice(0, 8);
      setHistory(newHistory);
      localStorage.setItem('dm_search_history', JSON.stringify(newHistory));
    } catch (e) {
      if ((e as { name?: string }).name === 'AbortError') return;
      setError(e instanceof Error ? e.message : 'Search failed');
      setResults([]);
    } finally { setLoading(false); }
  }, [collectionId, topK, history]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') doSearch(query);
    if (e.key === 'Escape') { setQuery(''); setResults([]); setSearched(false); }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('dm_search_history');
  };

  return (
    <AuthGate>
      <div className="min-h-screen pb-24 lg:pb-8">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">

          {/* Header */}
          <div>
            <p className="text-xs font-mono font-bold tracking-widest text-text-muted">SEMANTIC SEARCH</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Search Your Knowledge Base</h1>
            <p className="mt-1 text-sm text-text-secondary">
              Find exact passages using vector similarity — results ranked by semantic relevance.
            </p>
          </div>

          {/* Search bar */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Describe what you're looking for…"
                  className="w-full rounded-xl border border-border bg-bg-card pl-11 pr-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent/50 transition-colors"
                />
                {query && (
                  <button onClick={() => { setQuery(''); setResults([]); setSearched(false); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded text-text-muted hover:text-text-primary transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <button
                onClick={() => doSearch(query)}
                disabled={!query.trim() || loading}
                className="flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                Search
              </button>
              <button
                onClick={() => setShowFilters(f => !f)}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-3 text-sm transition-colors ${showFilters ? 'border-accent/40 bg-accent/8 text-accent' : 'border-border bg-bg-card text-text-muted hover:text-text-primary'}`}
              >
                <Sliders className="h-4 w-4" />
              </button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="flex flex-wrap items-center gap-3 glass rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-text-secondary">Collection</label>
                  <select value={collectionId} onChange={e => setCollectionId(e.target.value)}
                    className="rounded-lg border border-border bg-bg-secondary/50 px-2.5 py-1.5 text-xs text-text-secondary outline-none focus:border-accent/50 transition-colors">
                    <option value="">All collections</option>
                    {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-text-secondary">Results</label>
                  <select value={topK} onChange={e => setTopK(Number(e.target.value))}
                    className="rounded-lg border border-border bg-bg-secondary/50 px-2.5 py-1.5 text-xs text-text-secondary outline-none focus:border-accent/50 transition-colors">
                    {[4, 8, 12, 20].map(n => <option key={n} value={n}>{n} results</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
              <span>{error}</span>
              {error.includes('pgvector') && (
                <Link href="/settings" className="ml-auto underline text-xs">Go to Settings</Link>
              )}
            </div>
          )}

          {/* Results */}
          {searched && !loading && !error && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-text-secondary">
                  {results.length > 0 ? (
                    <><span className="font-bold text-text-primary">{results.length}</span> results for <span className="font-bold text-accent">"{query}"</span></>
                  ) : (
                    <>No results found for <span className="font-bold text-accent">"{query}"</span></>
                  )}
                </p>
                {results.length > 0 && (
                  <Link href={`/chat?q=${encodeURIComponent(query)}&collectionId=${collectionId}`}
                    className="flex items-center gap-1.5 text-xs text-accent hover:underline">
                    <MessageSquare className="h-3.5 w-3.5" /> Ask AI about this →
                  </Link>
                )}
              </div>

              {results.length === 0 ? (
                <div className="glass rounded-2xl flex flex-col items-center justify-center py-16 text-center px-4">
                  <Layers className="h-12 w-12 text-text-muted opacity-30 mb-3" />
                  <p className="font-medium text-text-secondary">No matching passages found</p>
                  <p className="text-sm text-text-muted mt-1 max-w-sm">Try rephrasing your query or uploading more relevant documents.</p>
                  <Link href="/documents" className="mt-4 flex items-center gap-1.5 text-xs text-accent hover:underline">
                    <FileText className="h-3.5 w-3.5" /> Upload documents →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {results.map((r, i) => (
                    <ResultCard key={r.chunkId} result={r} query={query} index={i + 1} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Empty state / history */}
          {!searched && (
            <div className="space-y-6">
              {history.length > 0 && (
                <div className="glass rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      <Clock className="h-4 w-4 text-text-muted" /> Recent searches
                    </h3>
                    <button onClick={clearHistory} className="text-xs text-text-muted hover:text-text-primary transition-colors">Clear</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {history.map(h => (
                      <button key={h} onClick={() => { setQuery(h); doSearch(h); }}
                        className="flex items-center gap-1.5 rounded-lg border border-border bg-bg-card/60 px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:border-border/80 transition-colors">
                        <Clock className="h-3 w-3 opacity-50" /> {h}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="glass rounded-2xl p-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 border border-accent/20 mx-auto mb-4">
                  <BookOpen className="h-7 w-7 text-accent" />
                </div>
                <h3 className="text-base font-bold mb-2">Semantic Vector Search</h3>
                <p className="text-sm text-text-secondary max-w-md mx-auto leading-relaxed mb-6">
                  Unlike keyword search, DocuMind understands meaning. Search for concepts, paraphrases,
                  or questions — it finds the most relevant passages from your knowledge base.
                </p>
                <div className="grid gap-2 sm:grid-cols-2 max-w-md mx-auto">
                  {[
                    'What are the payment terms?',
                    'Risk mitigation strategies',
                    'How does the algorithm work?',
                    'Key performance indicators',
                  ].map(s => (
                    <button key={s} onClick={() => { setQuery(s); doSearch(s); }}
                      className="rounded-xl border border-border bg-bg-card/60 px-4 py-2.5 text-left text-xs text-text-secondary hover:border-accent/25 hover:text-text-primary transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGate>
  );
}
