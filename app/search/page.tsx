'use client';

import { useCallback, useEffect, useState } from 'react';
import AuthGate from '@/components/app/AuthGate';
import CollectionPicker from '@/components/app/CollectionPicker';
import { useCollections } from '@/lib/use-collections';
import { useDebounce } from '@/lib/hooks/useDebounce';
import {
  Search, FileText, FolderOpen, ArrowRight, Loader2,
  Sliders, BarChart3, Zap, Hash,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface SearchResult {
  documentId:     string;
  documentName:   string;
  collectionId:   string;
  collectionName: string;
  snippet:        string;
  score:          number;
  type:           'semantic' | 'keyword';
}

export default function SearchPage() { return <AuthGate><SearchInner /></AuthGate>; }

function SearchInner() {
  const { collections } = useCollections();
  const [query,        setQuery]        = useState('');
  const [results,      setResults]      = useState<SearchResult[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [collectionId, setCollectionId] = useState<string | undefined>();
  const [mode,         setMode]         = useState<'hybrid'|'semantic'|'keyword'>('hybrid');
  const [total,        setTotal]        = useState(0);
  const [searched,     setSearched]     = useState(false);
  const debounced = useDebounce(query, 350);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) { setResults([]); setSearched(false); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams({ q, mode, topK: '12' });
      if (collectionId) params.set('collectionId', collectionId);
      const res  = await fetch(`/api/search?${params}`);
      const data = await res.json();
      setResults(data.results ?? []);
      setTotal(data.total ?? 0);
      setSearched(true);
    } catch { /**/ }
    finally { setLoading(false); }
  }, [mode, collectionId]);

  useEffect(() => { doSearch(debounced); }, [debounced, doSearch]);

  function highlight(text: string) {
    if (!query) return text;
    const words = query.split(/\s+/).filter((w) => w.length > 2);
    let out = text;
    for (const w of words) {
      out = out.replace(new RegExp(`(${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<mark>$1</mark>');
    }
    return out;
  }

  const groupedByCollection = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    const key = r.collectionName ?? 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto px-4 py-7">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Search</h1>
        <p className="text-sm text-text-muted mt-0.5">Semantic + keyword search across all your indexed documents</p>
      </div>

      {/* Search bar */}
      <div className="glass rounded-2xl p-4 mb-5">
        <div className="relative mb-3">
          {loading
            ? <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 animate-spin" />
            : <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          }
          <input value={query} onChange={(e) => setQuery(e.target.value)} autoFocus
            placeholder="Search across all documents…"
            className="w-full bg-bg-secondary border border-border rounded-xl pl-11 pr-4 py-3 text-sm placeholder:text-text-muted focus:outline-none focus:border-blue-500/50 transition" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Mode tabs */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(['hybrid','semantic','keyword'] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  mode === m ? 'bg-blue-600 text-white' : 'text-text-secondary hover:bg-bg-hover'
                }`}>
                {m === 'hybrid' && <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{m}</span>}
                {m === 'semantic' && <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" />{m}</span>}
                {m === 'keyword' && <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{m}</span>}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Sliders className="w-3.5 h-3.5 text-text-muted" />
            <CollectionPicker collections={collections} value={collectionId} onChange={setCollectionId} placeholder="All collections" />
          </div>
        </div>
      </div>

      {/* Mode descriptions */}
      <div className="mb-5 text-xs text-text-muted">
        {mode === 'hybrid'   && '⚡ Hybrid — combines vector similarity with keyword matching for best coverage'}
        {mode === 'semantic' && '🧠 Semantic — finds conceptually similar content even without exact word matches'}
        {mode === 'keyword'  && '🔍 Keyword — exact word and phrase matching across document names and content'}
      </div>

      {/* Results */}
      {searched && (
        <p className="text-xs text-text-muted mb-4">
          {total} result{total !== 1 ? 's' : ''} for <span className="text-text-primary">&quot;{query}&quot;</span>
        </p>
      )}

      {searched && results.length === 0 && !loading && (
        <div className="flex flex-col items-center py-16 text-center gap-3">
          <Search className="w-8 h-8 text-text-muted" />
          <p className="text-sm font-medium">No results found</p>
          <p className="text-xs text-text-muted">
            Try switching to <strong>Hybrid</strong> mode, or upload more documents to this collection.
          </p>
        </div>
      )}

      {!searched && !loading && (
        <div className="flex flex-col items-center py-16 text-center gap-3">
          <Search className="w-8 h-8 text-text-muted" />
          <p className="text-sm font-medium">Start searching</p>
          <p className="text-xs text-text-muted max-w-sm">
            Type at least 2 characters to search across all your indexed document chunks.
          </p>
        </div>
      )}

      <AnimatePresence initial={false}>
        {Object.entries(groupedByCollection).map(([colName, colResults]) => (
          <motion.div key={colName} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <FolderOpen className="w-3.5 h-3.5 text-text-muted" />
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{colName}</p>
              <span className="text-[10px] text-text-muted font-mono bg-bg-card border border-border px-1.5 py-0.5 rounded">
                {colResults.length}
              </span>
            </div>

            <div className="space-y-2">
              {colResults.map((r, i) => (
                <Link key={`${r.documentId}-${i}`} href={`/chat?collection=${r.collectionId}`}
                  className="flex items-start gap-3 px-4 py-3.5 rounded-xl border border-border bg-bg-card hover:border-blue-500/25 hover:bg-blue-500/3 transition-all group card-glow">
                  <div className="w-9 h-9 rounded-xl bg-blue-600/12 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-text-primary truncate">{r.documentName}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 ${
                        r.type === 'semantic' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>{r.type}</span>
                      <span className="text-[10px] text-text-muted font-mono ml-auto shrink-0">
                        {Math.round(r.score * 100)}%
                      </span>
                    </div>
                    <p
                      className="text-xs text-text-secondary leading-relaxed line-clamp-2 [&_mark]:bg-blue-500/20 [&_mark]:text-blue-300 [&_mark]:rounded-sm [&_mark]:px-0.5"
                      dangerouslySetInnerHTML={{ __html: highlight(r.snippet) }}
                    />
                  </div>
                  <ArrowRight className="w-4 h-4 text-text-muted shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
