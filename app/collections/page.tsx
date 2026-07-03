'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  FolderOpen,
  FolderPlus,
  Layers,
  Loader2,
  MessageSquare,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import AuthGate from '@/components/app/AuthGate';
import { useCollections } from '@/lib/use-collections';
import { DocumentMeta } from '@/lib/types';
import { relativeTime } from '@/lib/utils';

type Notice = { type: 'success' | 'error'; text: string } | null;

export default function CollectionsPage() {
  const { collections, loading, create, remove, refresh } = useCollections();
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [notice, setNotice] = useState<Notice>(null);
  const [saving, setSaving] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(true);

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
    const map = new Map<string, { docs: number; chunks: number; ready: number }>();
    for (const doc of documents) {
      const current = map.get(doc.collectionId) || { docs: 0, chunks: 0, ready: 0 };
      current.docs += 1;
      current.chunks += doc.chunkCount;
      if (doc.status === 'ready') current.ready += 1;
      map.set(doc.collectionId, current);
    }
    return map;
  }, [documents]);

  const totals = useMemo(
    () => ({
      collections: collections.length,
      docs: documents.length,
      chunks: documents.reduce((sum, doc) => sum + doc.chunkCount, 0),
    }),
    [collections.length, documents],
  );

  const createNewCollection = async () => {
    const cleanName = name.trim();
    if (!cleanName || saving) return;
    setSaving(true);
    const ok = await create(cleanName, description.trim() || undefined);
    setSaving(false);
    setNotice(ok ? { type: 'success', text: 'Collection created.' } : { type: 'error', text: 'Collection could not be created.' });
    if (ok) {
      setName('');
      setDescription('');
      await refreshDocuments();
    }
  };

  const deleteCollection = async (id: string) => {
    const ok = await remove(id);
    setNotice(ok ? { type: 'success', text: 'Collection and its documents were removed.' } : { type: 'error', text: 'Collection could not be removed.' });
    if (ok) await refreshDocuments();
  };

  return (
    <AuthGate>
      <div className="min-h-[calc(100vh-4rem)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-mono font-bold tracking-widest text-text-muted">WORKSPACE MAP</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Collections</h1>
            <p className="mt-2 max-w-2xl text-sm text-text-secondary">
              Segment documents by project, client, department, or research stream so chat retrieval stays focused.
            </p>
          </div>
          <button
            onClick={async () => {
              await Promise.all([refresh(), refreshDocuments()]);
            }}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-bg-card px-3 text-sm text-text-secondary transition-colors hover:text-text-primary"
          >
            <RefreshCw className={`h-4 w-4 ${loading || loadingDocs ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          <div className="glass rounded-xl p-4">
            <p className="text-xs text-text-muted">Collections</p>
            <p className="mt-2 text-2xl font-semibold">{totals.collections}</p>
          </div>
          <div className="glass rounded-xl p-4">
            <p className="text-xs text-text-muted">Documents</p>
            <p className="mt-2 text-2xl font-semibold">{totals.docs}</p>
          </div>
          <div className="glass rounded-xl p-4">
            <p className="text-xs text-text-muted">Chunks available</p>
            <p className="mt-2 text-2xl font-semibold">{totals.chunks}</p>
          </div>
        </section>

        {notice && (
          <div
            className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
              notice.type === 'success'
                ? 'border-success/25 bg-success/10 text-success'
                : 'border-danger/25 bg-danger/10 text-danger'
            }`}
          >
            {notice.type === 'success' ? <CheckCircle2 className="mt-0.5 h-4 w-4" /> : <AlertCircle className="mt-0.5 h-4 w-4" />}
            <span>{notice.text}</span>
          </div>
        )}

        <section className="grid gap-6 xl:grid-cols-[minmax(320px,420px)_1fr]">
          <div className="glass rounded-xl p-5">
            <div className="mb-4 flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-accent" />
              <h2 className="font-semibold">Create collection</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-muted">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Board reports, Contracts, Product specs"
                  className="w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-sm outline-none focus:border-accent/50"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-muted">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Optional notes about what belongs here."
                  className="w-full resize-none rounded-lg border border-border bg-bg-card px-3 py-2 text-sm outline-none focus:border-accent/50"
                />
              </div>
              <button
                onClick={createNewCollection}
                disabled={!name.trim() || saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderPlus className="h-4 w-4" />}
                Create workspace
              </button>
            </div>
          </div>

          <div className="glass overflow-hidden rounded-xl">
            <div className="border-b border-border p-4">
              <h2 className="font-semibold">Active collections</h2>
              <p className="text-xs text-text-muted">Deleting a collection also removes its indexed documents and chunks.</p>
            </div>
            {loading ? (
              <div className="flex items-center justify-center gap-2 p-10 text-sm text-text-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading collections
              </div>
            ) : collections.length === 0 ? (
              <div className="p-10 text-center">
                <FolderOpen className="mx-auto h-10 w-10 text-text-muted" />
                <h3 className="mt-3 font-semibold">No collections yet</h3>
                <p className="mx-auto mt-2 max-w-sm text-sm text-text-muted">
                  Create a workspace on the left, then upload documents into it.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/70">
                {collections.map((collection) => {
                  const stats = docStats.get(collection.id) || { docs: 0, chunks: 0, ready: 0 };
                  return (
                    <article key={collection.id} className="p-4">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <FolderOpen className="h-4 w-4 text-accent" />
                            <h3 className="truncate font-semibold">{collection.name}</h3>
                          </div>
                          <p className="mt-1 text-sm text-text-secondary">
                            {collection.description || 'No description provided.'}
                          </p>
                          <p className="mt-2 text-xs text-text-muted">Created {relativeTime(collection.createdAt)}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/documents?collectionId=${collection.id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg-card px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
                          >
                            <Layers className="h-3.5 w-3.5" />
                            Documents
                          </Link>
                          <Link
                            href={`/chat?collectionId=${collection.id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            Chat
                          </Link>
                          <button
                            onClick={() => deleteCollection(collection.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                            aria-label={`Delete ${collection.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-2 sm:grid-cols-3">
                        <div className="rounded-lg border border-border bg-bg-secondary/45 px-3 py-2">
                          <p className="text-[11px] text-text-muted">Documents</p>
                          <p className="mt-1 font-semibold">{stats.docs}</p>
                        </div>
                        <div className="rounded-lg border border-border bg-bg-secondary/45 px-3 py-2">
                          <p className="text-[11px] text-text-muted">Ready</p>
                          <p className="mt-1 font-semibold">{stats.ready}</p>
                        </div>
                        <div className="rounded-lg border border-border bg-bg-secondary/45 px-3 py-2">
                          <p className="text-[11px] text-text-muted">Chunks</p>
                          <p className="mt-1 font-semibold">{stats.chunks}</p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
      </div>
    </AuthGate>
  );
}
