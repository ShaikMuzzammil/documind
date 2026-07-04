'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle, CheckCircle2, FolderOpen, FolderPlus, Layers,
  Loader2, MessageSquare, RefreshCw, Trash2, X, Upload,
  FileText, ChevronRight, Hash,
} from 'lucide-react';
import AuthGate from '@/components/app/AuthGate';
import { useCollections } from '@/lib/use-collections';
import { DocumentMeta } from '@/lib/types';
import { relativeTime } from '@/lib/utils';

type Notice = { type: 'success' | 'error'; text: string } | null;

const COLLECTION_COLORS = [
  'from-indigo-500/20 to-purple-500/10 border-indigo-500/20',
  'from-cyan-500/20 to-blue-500/10 border-cyan-500/20',
  'from-emerald-500/20 to-green-500/10 border-emerald-500/20',
  'from-orange-500/20 to-amber-500/10 border-orange-500/20',
  'from-pink-500/20 to-rose-500/10 border-pink-500/20',
  'from-violet-500/20 to-fuchsia-500/10 border-violet-500/20',
];

const ICON_COLORS = [
  'text-indigo-400', 'text-cyan-400', 'text-emerald-400',
  'text-orange-400', 'text-pink-400', 'text-violet-400',
];

export default function CollectionsPage() {
  const { collections, loading, create, remove, refresh } = useCollections();
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [notice, setNotice] = useState<Notice>(null);
  const [saving, setSaving] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refreshDocuments = useCallback(async () => {
    setLoadingDocs(true);
    try {
      const res = await fetch('/api/documents');
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch {
      setDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    refreshDocuments();
    const timer = window.setInterval(refreshDocuments, 8000);
    return () => window.clearInterval(timer);
  }, [refreshDocuments]);

  const docStats = useMemo(() => {
    const map = new Map<string, { docs: number; chunks: number; ready: number; bytes: number }>();
    for (const doc of documents) {
      const current = map.get(doc.collectionId) || { docs: 0, chunks: 0, ready: 0, bytes: 0 };
      current.docs += 1;
      current.chunks += doc.chunkCount;
      current.bytes += doc.size;
      if (doc.status === 'ready') current.ready += 1;
      map.set(doc.collectionId, current);
    }
    return map;
  }, [documents]);

  const totals = useMemo(() => ({
    collections: collections.length,
    docs: documents.length,
    chunks: documents.reduce((sum, doc) => sum + doc.chunkCount, 0),
  }), [collections.length, documents]);

  const createNewCollection = async () => {
    const cleanName = name.trim();
    if (!cleanName || saving) return;
    setSaving(true);
    const ok = await create(cleanName, description.trim() || undefined);
    setSaving(false);
    setNotice(ok
      ? { type: 'success', text: `Collection "${cleanName}" created.` }
      : { type: 'error', text: 'Collection could not be created.' });
    if (ok) { setName(''); setDescription(''); await refreshDocuments(); }
  };

  const deleteCollection = async (id: string) => {
    setDeletingId(id);
    const ok = await remove(id);
    setNotice(ok
      ? { type: 'success', text: 'Collection and its documents removed.' }
      : { type: 'error', text: 'Collection could not be removed.' });
    if (ok) await refreshDocuments();
    setDeletingId(null);
  };

  return (
    <AuthGate>
      <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8 pb-24 lg:pb-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-mono font-bold tracking-widest text-text-muted">WORKSPACE MAP</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">Collections</h1>
              <p className="mt-2 max-w-2xl text-sm text-text-secondary">
                Organize documents by project, client, or topic. Chat retrieval can be scoped to any collection.
              </p>
            </div>
            <button onClick={async () => { await Promise.all([refresh(), refreshDocuments()]); }}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-bg-card px-3 text-sm text-text-secondary transition-colors hover:text-text-primary"
            >
              <RefreshCw className={`h-4 w-4 ${loading || loadingDocs ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </header>

          {/* Stats */}
          <section className="grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Collections', value: totals.collections, Icon: FolderOpen },
              { label: 'Documents',   value: totals.docs,         Icon: FileText },
              { label: 'Total Chunks', value: totals.chunks,      Icon: Layers },
            ].map(({ label, value, Icon }) => (
              <div key={label} className="glass rounded-xl p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-text-muted">{label}</p>
                  <p className="text-2xl font-bold">{value}</p>
                </div>
              </div>
            ))}
          </section>

          {notice && (
            <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${notice.type === 'success' ? 'border-success/25 bg-success/10 text-success' : 'border-danger/25 bg-danger/10 text-danger'}`}>
              {notice.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
              <span className="flex-1">{notice.text}</span>
              <button onClick={() => setNotice(null)}><X className="h-3.5 w-3.5 opacity-60" /></button>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            {/* Collections grid */}
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center gap-2 p-12 text-sm text-text-muted">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading collections…
                </div>
              ) : collections.length === 0 ? (
                <div className="glass rounded-xl p-12 text-center">
                  <FolderOpen className="mx-auto h-12 w-12 text-text-muted opacity-30 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No collections yet</h3>
                  <p className="text-sm text-text-muted max-w-sm mx-auto">
                    Create your first collection to start organizing documents and enabling focused chat.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {collections.map((col, i) => {
                    const stats = docStats.get(col.id) || { docs: 0, chunks: 0, ready: 0, bytes: 0 };
                    const colorIdx = i % COLLECTION_COLORS.length;
                    const readyPct = stats.docs > 0 ? Math.round((stats.ready / stats.docs) * 100) : 0;
                    return (
                      <div key={col.id} className={`glass rounded-xl border overflow-hidden flex flex-col bg-gradient-to-br ${COLLECTION_COLORS[colorIdx]}`}>
                        <div className="p-5 flex-1">
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-bg-card/60 border border-border/60 flex items-center justify-center">
                              <FolderOpen className={`h-5 w-5 ${ICON_COLORS[colorIdx]}`} />
                            </div>
                            <button
                              onClick={() => deleteCollection(col.id)}
                              disabled={deletingId === col.id}
                              className="h-8 w-8 flex items-center justify-center rounded-lg text-text-muted hover:bg-danger/10 hover:text-danger transition-colors disabled:opacity-40"
                            >
                              {deletingId === col.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                            </button>
                          </div>

                          <h3 className="font-bold text-base mb-1 truncate">{col.name}</h3>
                          {col.description && (
                            <p className="text-xs text-text-muted mb-3 line-clamp-2">{col.description}</p>
                          )}

                          <div className="flex items-center gap-4 text-xs text-text-secondary mt-3">
                            <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" />{stats.docs} docs</span>
                            <span className="flex items-center gap-1"><Hash className="h-3.5 w-3.5" />{stats.chunks} chunks</span>
                          </div>

                          {stats.docs > 0 && (
                            <div className="mt-3">
                              <div className="flex justify-between text-[10px] text-text-muted mb-1">
                                <span>Ready</span><span>{readyPct}%</span>
                              </div>
                              <div className="h-1 w-full bg-bg-card/60 rounded-full overflow-hidden">
                                <div className="h-full bg-success rounded-full transition-all" style={{ width: `${readyPct}%` }} />
                              </div>
                            </div>
                          )}

                          <p className="text-[10px] text-text-muted mt-3">{relativeTime(col.createdAt)}</p>
                        </div>

                        <div className="border-t border-border/50 grid grid-cols-2 divide-x divide-border/50">
                          <Link
                            href={`/chat?collectionId=${col.id}`}
                            className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-text-secondary hover:text-accent hover:bg-accent/5 transition-colors"
                          >
                            <MessageSquare className="h-3.5 w-3.5" /> Chat
                          </Link>
                          <Link
                            href={`/documents?collectionId=${col.id}`}
                            className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-text-secondary hover:text-accent hover:bg-accent/5 transition-colors"
                          >
                            <Upload className="h-3.5 w-3.5" /> Upload
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Create new collection */}
            <div className="space-y-4">
              <div className="glass rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <FolderPlus className="h-5 w-5 text-accent" />
                  <h2 className="font-semibold">New collection</h2>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1.5">Name *</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && createNewCollection()}
                      placeholder="Research, Legal, Q3 Analysis…"
                      className="w-full rounded-lg border border-border bg-bg-card px-3 py-2.5 text-sm outline-none focus:border-accent/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1.5">Description <span className="opacity-50">(optional)</span></label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What this collection contains…"
                      rows={2}
                      className="w-full resize-none rounded-lg border border-border bg-bg-card px-3 py-2.5 text-sm outline-none focus:border-accent/50"
                    />
                  </div>
                  <button
                    onClick={createNewCollection}
                    disabled={!name.trim() || saving}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderPlus className="h-4 w-4" />}
                    {saving ? 'Creating…' : 'Create collection'}
                  </button>
                </div>
              </div>

              <div className="glass rounded-xl p-4 text-xs text-text-muted space-y-2">
                <p className="font-semibold text-text-secondary">Tips</p>
                <p>• Scope chat to one collection for focused answers</p>
                <p>• Keep related documents in the same collection</p>
                <p>• Use descriptive names for quick navigation</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGate>
  );
}
