'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle, CheckCircle2, Download, Edit2, FolderOpen,
  FolderPlus, Layers, Loader2, MessageSquare, RefreshCw,
  Save, Trash2, X, BarChart3, FileText,
} from 'lucide-react';
import AuthGate from '@/components/app/AuthGate';
import { useCollections } from '@/lib/use-collections';
import { DocumentMeta, Collection } from '@/lib/types';
import { formatBytes, relativeTime } from '@/lib/utils';

type Notice = { type: 'success' | 'error'; text: string } | null;

export default function CollectionsPage() {
  const { collections, loading, create, update, remove, refresh } = useCollections();
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [notice, setNotice] = useState<Notice>(null);
  const [saving, setSaving] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [exportingId, setExportingId] = useState<string | null>(null);

  const refreshDocuments = useCallback(async () => {
    setLoadingDocs(true);
    try {
      const data = await fetch('/api/documents').then((r) => r.json());
      setDocuments(data.documents || []);
    } catch { setDocuments([]); }
    finally { setLoadingDocs(false); }
  }, []);

  useEffect(() => {
    refreshDocuments();
    const t = window.setInterval(refreshDocuments, 10000);
    return () => window.clearInterval(t);
  }, [refreshDocuments]);

  const docStats = useMemo(() => {
    const map = new Map<string, { docs: number; chunks: number; ready: number; size: number }>();
    for (const doc of documents) {
      const cur = map.get(doc.collectionId) || { docs: 0, chunks: 0, ready: 0, size: 0 };
      cur.docs += 1; cur.chunks += doc.chunkCount; cur.size += doc.size;
      if (doc.status === 'ready') cur.ready += 1;
      map.set(doc.collectionId, cur);
    }
    return map;
  }, [documents]);

  const totals = useMemo(() => ({
    collections: collections.length,
    docs: documents.length,
    chunks: documents.reduce((s, d) => s + d.chunkCount, 0),
    size: documents.reduce((s, d) => s + d.size, 0),
  }), [collections.length, documents]);

  const showNotice = (n: Notice) => { setNotice(n); setTimeout(() => setNotice(null), 4000); };

  const createNew = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    const ok = await create(name.trim(), description.trim() || undefined);
    setSaving(false);
    showNotice(ok ? { type: 'success', text: 'Collection created.' } : { type: 'error', text: 'Could not create collection.' });
    if (ok) { setName(''); setDescription(''); }
  };

  const startEdit = (col: Collection) => {
    setEditingId(col.id); setEditName(col.name); setEditDesc(col.description || '');
  };
  const cancelEdit = () => { setEditingId(null); setEditName(''); setEditDesc(''); };

  const saveEdit = async (id: string) => {
    if (!editName.trim() || editSaving) return;
    setEditSaving(true);
    const ok = await update(id, { name: editName.trim(), description: editDesc.trim() });
    setEditSaving(false);
    if (ok) { showNotice({ type: 'success', text: 'Collection updated.' }); cancelEdit(); }
    else showNotice({ type: 'error', text: 'Could not update collection.' });
  };

  const deleteCollection = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}" and all its documents? This cannot be undone.`)) return;
    const ok = await remove(id);
    showNotice(ok ? { type: 'success', text: 'Collection and documents removed.' } : { type: 'error', text: 'Could not remove collection.' });
    if (ok) await refreshDocuments();
  };

  const exportCollection = async (id: string, colName: string) => {
    setExportingId(id);
    try {
      const res = await fetch('/api/export/collections');
      const data = await res.json();
      const col = data.collections.find((c: { id: string }) => c.id === id);
      if (!col) return;
      const blob = new Blob([JSON.stringify(col, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${colName.replace(/\s+/g, '-').toLowerCase()}-export.json`; a.click();
      URL.revokeObjectURL(url);
      showNotice({ type: 'success', text: `"${colName}" exported.` });
    } catch { showNotice({ type: 'error', text: 'Export failed.' }); }
    finally { setExportingId(null); }
  };

  return (
    <AuthGate>
      <div className="min-h-[calc(100vh-4rem)] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* Header */}
          <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-mono font-bold tracking-widest text-text-muted">WORKSPACE MAP</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">Collections</h1>
              <p className="mt-2 max-w-2xl text-sm text-text-secondary">
                Isolate documents by project, client, or topic. Chat retrieval stays scoped to the collection you choose.
              </p>
            </div>
            <button onClick={() => Promise.all([refresh(), refreshDocuments()])}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-bg-card px-3 text-sm text-text-secondary transition-colors hover:text-text-primary">
              <RefreshCw className={`h-4 w-4 ${loading || loadingDocs ? 'animate-spin' : ''}`} />Refresh
            </button>
          </header>

          {/* Stats */}
          <section className="grid gap-3 sm:grid-cols-4">
            {[
              { icon: FolderOpen, label: 'Collections',   value: totals.collections, sub: 'workspaces' },
              { icon: FileText,   label: 'Documents',     value: totals.docs,        sub: 'total indexed' },
              { icon: Layers,     label: 'Chunks',        value: totals.chunks,      sub: 'searchable passages' },
              { icon: BarChart3,  label: 'Storage',       value: formatBytes(totals.size), sub: 'raw size' },
            ].map(({ icon: Icon, label, value, sub }) => (
              <div key={label} className="glass rounded-xl p-4">
                <Icon className="w-4 h-4 text-accent mb-2" />
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-text-muted">{label}</p>
                <p className="text-[10px] text-text-muted/70">{sub}</p>
              </div>
            ))}
          </section>

          {/* Notice */}
          {notice && (
            <div className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
              notice.type === 'success' ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400'
                                       : 'border-red-500/25 bg-red-500/10 text-red-400'}`}>
              {notice.type === 'success' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
              <span>{notice.text}</span>
            </div>
          )}

          <section className="grid gap-6 xl:grid-cols-[minmax(320px,420px)_1fr]">
            {/* Create form */}
            <div className="space-y-4">
              <div className="glass rounded-xl p-5">
                <div className="mb-4 flex items-center gap-2">
                  <FolderPlus className="h-5 w-5 text-accent" />
                  <h2 className="font-semibold">Create collection</h2>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-text-muted">Name *</label>
                    <input value={name} onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && createNew()}
                      placeholder="Legal contracts, Q3 research…"
                      className="w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-sm outline-none focus:border-accent/50" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-text-muted">Description</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                      rows={3} placeholder="What kind of documents belong here?"
                      className="w-full resize-none rounded-lg border border-border bg-bg-card px-3 py-2 text-sm outline-none focus:border-accent/50" />
                  </div>
                  <button onClick={createNew} disabled={!name.trim() || saving}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderPlus className="h-4 w-4" />}
                    Create workspace
                  </button>
                </div>
              </div>

              <Link href="/export"
                className="glass rounded-xl p-4 flex items-center gap-3 hover:border-accent/30 transition-colors cursor-pointer">
                <Download className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Export all collections</p>
                  <p className="text-xs text-text-muted">JSON report with all docs + stats</p>
                </div>
              </Link>
            </div>

            {/* Collections list */}
            <div className="glass overflow-hidden rounded-xl">
              <div className="border-b border-border p-4">
                <h2 className="font-semibold">Active collections</h2>
                <p className="text-xs text-text-muted">Deleting removes all indexed documents and chunks.</p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center gap-2 p-10 text-sm text-text-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />Loading collections
                </div>
              ) : collections.length === 0 ? (
                <div className="p-10 text-center">
                  <FolderOpen className="mx-auto h-10 w-10 text-text-muted opacity-40" />
                  <h3 className="mt-3 font-semibold">No collections yet</h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-text-muted">Create your first workspace on the left.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/70">
                  {collections.map((col) => {
                    const stats = docStats.get(col.id) || { docs: 0, chunks: 0, ready: 0, size: 0 };
                    const isEditing = editingId === col.id;
                    return (
                      <article key={col.id} className="p-4 hover:bg-white/[0.01] transition-colors">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0 flex-1">
                            {isEditing ? (
                              <div className="space-y-2">
                                <input value={editName} onChange={(e) => setEditName(e.target.value)}
                                  autoFocus onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(col.id); if (e.key === 'Escape') cancelEdit(); }}
                                  className="w-full rounded-lg border border-accent/40 bg-bg-card px-3 py-1.5 text-sm font-semibold outline-none" />
                                <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
                                  rows={2} placeholder="Description (optional)"
                                  className="w-full resize-none rounded-lg border border-border bg-bg-card px-3 py-1.5 text-xs outline-none focus:border-accent/40" />
                                <div className="flex gap-2">
                                  <button onClick={() => saveEdit(col.id)} disabled={!editName.trim() || editSaving}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40">
                                    {editSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}Save
                                  </button>
                                  <button onClick={cancelEdit}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text-muted hover:text-text-secondary">
                                    <X className="w-3 h-3" />Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <FolderOpen className="h-4 w-4 text-accent shrink-0" />
                                  <h3 className="font-semibold truncate">{col.name}</h3>
                                  <span className="text-[10px] font-mono text-text-muted border border-border px-1.5 py-0.5 rounded">
                                    {col.id.slice(0, 8)}
                                  </span>
                                </div>
                                <p className="mt-1 text-sm text-text-secondary">
                                  {col.description || <span className="italic text-text-muted">No description</span>}
                                </p>
                                <p className="mt-1 text-xs text-text-muted">Created {relativeTime(col.createdAt)}</p>
                              </>
                            )}
                          </div>

                          {!isEditing && (
                            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                              <Link href={`/documents?collectionId=${col.id}`}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg-card px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary">
                                <Layers className="h-3.5 w-3.5" />Docs
                              </Link>
                              <Link href={`/chat?collectionId=${col.id}`}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90">
                                <MessageSquare className="h-3.5 w-3.5" />Chat
                              </Link>
                              <button onClick={() => startEdit(col)} title="Edit name / description"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-muted transition-colors hover:bg-white/5 hover:text-text-secondary">
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => exportCollection(col.id, col.name)} disabled={exportingId === col.id}
                                title="Export this collection as JSON"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-muted transition-colors hover:bg-white/5 hover:text-emerald-400 disabled:opacity-40">
                                {exportingId === col.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                              </button>
                              <button onClick={() => deleteCollection(col.id, col.name)} title={`Delete ${col.name}`}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-red-500/10 hover:text-red-400">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Mini stats */}
                        {!isEditing && (
                          <div className="mt-4 grid gap-2 sm:grid-cols-4">
                            {[
                              { label: 'Documents', value: stats.docs },
                              { label: 'Ready',     value: stats.ready },
                              { label: 'Chunks',    value: stats.chunks },
                              { label: 'Size',      value: formatBytes(stats.size) },
                            ].map(({ label, value }) => (
                              <div key={label} className="rounded-lg border border-border bg-bg-secondary/45 px-3 py-2">
                                <p className="text-[11px] text-text-muted">{label}</p>
                                <p className="mt-0.5 font-semibold text-sm">{value}</p>
                              </div>
                            ))}
                          </div>
                        )}
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
