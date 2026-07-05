'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle, CheckCircle2, Edit2, FolderOpen, FolderPlus,
  Hash, Layers, Loader2, MessageSquare, Plus, RefreshCw,
  Save, Search, Trash2, Upload, X, FileText, ChevronRight,
  BookOpen, Grid3x3,
} from 'lucide-react';
import AuthGate from '@/components/app/AuthGate';
import { useCollections } from '@/lib/use-collections';
import { DocumentMeta } from '@/lib/types';
import { formatBytes, relativeTime } from '@/lib/utils';

type Notice = { type: 'success' | 'error'; text: string } | null;

const PALETTE = [
  { grad: 'from-indigo-500/15 to-purple-500/8',   border: 'border-indigo-500/25',  icon: 'text-indigo-400',  iconBg: 'bg-indigo-500/12' },
  { grad: 'from-cyan-500/15 to-blue-500/8',        border: 'border-cyan-500/25',    icon: 'text-cyan-400',    iconBg: 'bg-cyan-500/12'   },
  { grad: 'from-emerald-500/15 to-green-500/8',    border: 'border-emerald-500/25', icon: 'text-emerald-400', iconBg: 'bg-emerald-500/12' },
  { grad: 'from-orange-500/15 to-amber-500/8',     border: 'border-orange-500/25',  icon: 'text-orange-400',  iconBg: 'bg-orange-500/12' },
  { grad: 'from-pink-500/15 to-rose-500/8',        border: 'border-pink-500/25',    icon: 'text-pink-400',    iconBg: 'bg-pink-500/12'   },
  { grad: 'from-violet-500/15 to-fuchsia-500/8',   border: 'border-violet-500/25',  icon: 'text-violet-400',  iconBg: 'bg-violet-500/12' },
  { grad: 'from-teal-500/15 to-cyan-500/8',        border: 'border-teal-500/25',    icon: 'text-teal-400',    iconBg: 'bg-teal-500/12'   },
  { grad: 'from-amber-500/15 to-yellow-500/8',     border: 'border-amber-500/25',   icon: 'text-amber-400',   iconBg: 'bg-amber-500/12'  },
];

function CollectionCard({
  col, index, stats, onDelete, onRename, deleting,
}: {
  col: { id: string; name: string; description?: string; createdAt: string };
  index: number;
  stats: { docs: number; chunks: number; ready: number; bytes: number };
  onDelete: () => void;
  onRename: (name: string, desc: string) => Promise<void>;
  deleting: boolean;
}) {
  const palette = PALETTE[index % PALETTE.length];
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(col.name);
  const [editDesc, setEditDesc] = useState(col.description || '');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const readyPct = stats.docs > 0 ? Math.round((stats.ready / stats.docs) * 100) : 0;

  const startEdit = () => { setEditing(true); setEditName(col.name); setEditDesc(col.description || ''); setTimeout(() => inputRef.current?.focus(), 50); };
  const cancelEdit = () => { setEditing(false); };
  const saveEdit = async () => {
    if (!editName.trim() || saving) return;
    setSaving(true);
    await onRename(editName.trim(), editDesc.trim());
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className={`glass rounded-2xl border ${palette.border} overflow-hidden flex flex-col bg-gradient-to-br ${palette.grad} hover:shadow-lg hover:shadow-black/20 transition-all`}>
      <div className="p-5 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className={`w-11 h-11 rounded-xl ${palette.iconBg} border border-white/10 flex items-center justify-center shrink-0`}>
            <FolderOpen className={`h-5 w-5 ${palette.icon}`} />
          </div>
          <div className="flex items-center gap-1">
            {!editing && (
              <button onClick={startEdit}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors"
                title="Rename"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
            )}
            <button onClick={onDelete} disabled={deleting}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-text-muted hover:bg-danger/10 hover:text-danger transition-colors disabled:opacity-40"
              title="Delete collection"
            >
              {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Name / Edit */}
        {editing ? (
          <div className="space-y-2 mb-3">
            <input ref={inputRef} value={editName} onChange={e => setEditName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
              className="w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-sm font-semibold outline-none focus:border-accent/50"
              placeholder="Collection name"
            />
            <input value={editDesc} onChange={e => setEditDesc(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-xs outline-none focus:border-accent/50"
              placeholder="Description (optional)"
            />
            <div className="flex gap-2">
              <button onClick={saveEdit} disabled={!editName.trim() || saving}
                className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-accent py-1.5 text-xs font-semibold text-white disabled:opacity-40"
              >
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save
              </button>
              <button onClick={cancelEdit} className="flex-1 rounded-lg border border-border py-1.5 text-xs text-text-muted hover:text-text-primary">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-3">
            <h3 className="font-bold text-base truncate">{col.name}</h3>
            {col.description && <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{col.description}</p>}
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-text-secondary">
          <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" />{stats.docs} doc{stats.docs !== 1 ? 's' : ''}</span>
          <span className="flex items-center gap-1"><Hash className="h-3.5 w-3.5" />{stats.chunks} chunks</span>
          {stats.bytes > 0 && <span className="text-text-muted">{formatBytes(stats.bytes)}</span>}
        </div>

        {/* Ready progress bar */}
        {stats.docs > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-text-muted mb-1">
              <span>{stats.ready}/{stats.docs} ready</span><span>{readyPct}%</span>
            </div>
            <div className="h-1.5 w-full bg-bg-card/60 rounded-full overflow-hidden">
              <div className="h-full bg-success rounded-full transition-all duration-500" style={{ width: `${readyPct}%` }} />
            </div>
          </div>
        )}

        <p className="text-[10px] text-text-muted mt-3">{relativeTime(col.createdAt)}</p>
      </div>

      {/* Action strip — 3 buttons */}
      <div className="border-t border-border/40 grid grid-cols-3 divide-x divide-border/40">
        <Link href={`/chat?collectionId=${col.id}`}
          className="flex flex-col items-center gap-1 py-3 text-[10px] font-medium text-text-muted hover:text-accent hover:bg-accent/5 transition-colors"
        >
          <MessageSquare className="h-3.5 w-3.5" /> Chat
        </Link>
        <Link href={`/documents?collectionId=${col.id}`}
          className="flex flex-col items-center gap-1 py-3 text-[10px] font-medium text-text-muted hover:text-accent hover:bg-accent/5 transition-colors"
        >
          <Upload className="h-3.5 w-3.5" /> Upload
        </Link>
        <Link href={`/documents?collectionId=${col.id}`}
          className="flex flex-col items-center gap-1 py-3 text-[10px] font-medium text-text-muted hover:text-accent hover:bg-accent/5 transition-colors"
        >
          <BookOpen className="h-3.5 w-3.5" /> View Docs
        </Link>
      </div>
    </div>
  );
}

export default function CollectionsPage() {
  const { collections, loading, create, update, remove, refresh } = useCollections();
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [notice, setNotice] = useState<Notice>(null);
  const [saving, setSaving] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

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
    const timer = window.setInterval(refreshDocuments, 10000);
    return () => window.clearInterval(timer);
  }, [refreshDocuments]);

  useEffect(() => {
    if (showCreatePanel) setTimeout(() => nameInputRef.current?.focus(), 80);
  }, [showCreatePanel]);

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
    chunks: documents.reduce((s, d) => s + d.chunkCount, 0),
    bytes: documents.reduce((s, d) => s + d.size, 0),
    ready: documents.filter(d => d.status === 'ready').length,
  }), [collections.length, documents]);

  const filteredCollections = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return collections;
    return collections.filter(c => c.name.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q));
  }, [collections, searchQuery]);

  const createCollection = async () => {
    const cleanName = name.trim();
    if (!cleanName || saving) return;
    setSaving(true);
    const ok = await create(cleanName, description.trim() || undefined);
    setSaving(false);
    if (ok) {
      setNotice({ type: 'success', text: `"${cleanName}" created.` });
      setName(''); setDescription(''); setShowCreatePanel(false);
      await refreshDocuments();
    } else {
      setNotice({ type: 'error', text: 'Could not create collection.' });
    }
  };

  const deleteCollection = async (id: string) => {
    setDeletingId(id);
    const ok = await remove(id);
    setNotice(ok
      ? { type: 'success', text: 'Collection and its documents removed.' }
      : { type: 'error', text: 'Could not remove collection.' });
    if (ok) await refreshDocuments();
    setDeletingId(null);
  };

  const renameCollection = async (id: string, newName: string, newDesc: string) => {
    const ok = await update(id, newName, newDesc || undefined);
    if (ok) setNotice({ type: 'success', text: 'Collection updated.' });
    else setNotice({ type: 'error', text: 'Could not update collection.' });
  };

  return (
    <AuthGate>
      <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8 pb-24 lg:pb-8">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* Header */}
          <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-mono font-bold tracking-widest text-text-muted">WORKSPACE MAP</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">Collections</h1>
              <p className="mt-1 max-w-xl text-sm text-text-secondary">
                Organize documents by project, client, or topic. Scope chat retrieval to any single collection.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={async () => { await Promise.all([refresh(), refreshDocuments()]); }}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-bg-card px-3 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${(loading || loadingDocs) ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button onClick={() => setShowCreatePanel(p => !p)}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              >
                <Plus className="h-4 w-4" />
                New Collection
              </button>
            </div>
          </header>

          {/* Stats row */}
          <section className="grid gap-3 sm:grid-cols-4">
            {[
              { label: 'Collections', value: totals.collections, Icon: Grid3x3,  color: 'text-accent' },
              { label: 'Documents',   value: totals.docs,         Icon: FileText, color: 'text-blue-400' },
              { label: 'Total Chunks',value: totals.chunks,       Icon: Layers,   color: 'text-emerald-400' },
              { label: 'Ready',       value: totals.ready,        Icon: CheckCircle2, color: 'text-success' },
            ].map(({ label, value, Icon, color }) => (
              <div key={label} className="glass rounded-xl p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-bg-card border border-border flex items-center justify-center">
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <div>
                  <p className="text-xs text-text-muted">{label}</p>
                  <p className="text-2xl font-bold">{value}</p>
                </div>
              </div>
            ))}
          </section>

          {/* Notice */}
          {notice && (
            <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${notice.type === 'success' ? 'border-success/25 bg-success/10 text-success' : 'border-danger/25 bg-danger/10 text-danger'}`}>
              {notice.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
              <span className="flex-1">{notice.text}</span>
              <button onClick={() => setNotice(null)}><X className="h-3.5 w-3.5 opacity-60" /></button>
            </div>
          )}

          {/* Create collection panel (slide-in) */}
          {showCreatePanel && (
            <div className="glass rounded-2xl border border-accent/20 bg-accent/3 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold flex items-center gap-2"><FolderPlus className="h-4 w-4 text-accent" /> New Collection</h2>
                <button onClick={() => setShowCreatePanel(false)} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid sm:grid-cols-[1fr_220px] gap-3">
                <div className="space-y-3">
                  <input
                    ref={nameInputRef}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && createCollection()}
                    placeholder="Collection name — Research, Legal, Q3 Analysis…"
                    className="w-full rounded-xl border border-border bg-bg-card px-4 py-3 text-sm outline-none focus:border-accent/50 transition-colors"
                  />
                  <input
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Description (optional)"
                    className="w-full rounded-xl border border-border bg-bg-card px-4 py-3 text-sm outline-none focus:border-accent/50 transition-colors"
                  />
                </div>
                <button
                  onClick={createCollection}
                  disabled={!name.trim() || saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderPlus className="h-4 w-4" />}
                  {saving ? 'Creating…' : 'Create collection'}
                </button>
              </div>
            </div>
          )}

          {/* Search */}
          {collections.length > 2 && (
            <div className="relative max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Filter collections…"
                className="w-full rounded-lg border border-border bg-bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-accent/50"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Collections grid */}
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => <div key={i} className="glass animate-pulse rounded-2xl h-56" />)}
            </div>
          ) : filteredCollections.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              {searchQuery ? (
                <>
                  <Search className="mx-auto h-10 w-10 text-text-muted opacity-30 mb-3" />
                  <p className="font-semibold mb-1">No collections match &ldquo;{searchQuery}&rdquo;</p>
                  <button onClick={() => setSearchQuery('')} className="mt-3 text-sm text-accent hover:underline">Clear filter</button>
                </>
              ) : (
                <>
                  <FolderOpen className="mx-auto h-12 w-12 text-text-muted opacity-25 mb-4" />
                  <h3 className="font-bold text-lg mb-2">Create your first collection</h3>
                  <p className="text-sm text-text-muted max-w-sm mx-auto mb-6">
                    Organize documents by project or topic. Each collection can be used to scope AI answers.
                  </p>
                  <button onClick={() => setShowCreatePanel(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                  >
                    <FolderPlus className="h-4 w-4" /> Create first collection
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCollections.map((col, i) => (
                <CollectionCard
                  key={col.id}
                  col={col}
                  index={i}
                  stats={docStats.get(col.id) || { docs: 0, chunks: 0, ready: 0, bytes: 0 }}
                  onDelete={() => deleteCollection(col.id)}
                  onRename={(n, d) => renameCollection(col.id, n, d)}
                  deleting={deletingId === col.id}
                />
              ))}
              {/* Add new card */}
              <button onClick={() => { setShowCreatePanel(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="glass rounded-2xl border border-dashed border-border hover:border-accent/40 hover:bg-accent/3 flex flex-col items-center justify-center gap-3 p-8 transition-all group min-h-[200px]"
              >
                <div className="w-11 h-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center group-hover:bg-accent/15 transition-colors">
                  <FolderPlus className="h-5 w-5 text-accent" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-sm">New collection</p>
                  <p className="text-xs text-text-muted mt-0.5">Click to add</p>
                </div>
              </button>
            </div>
          )}

          {/* Quick link to documents */}
          {collections.length > 0 && (
            <div className="flex items-center justify-between glass rounded-xl px-5 py-3.5">
              <div className="text-sm text-text-secondary">
                {totals.docs} document{totals.docs !== 1 ? 's' : ''} across {totals.collections} collection{totals.collections !== 1 ? 's' : ''}
              </div>
              <div className="flex items-center gap-3">
                <Link href="/documents" className="text-xs text-accent hover:underline flex items-center gap-1">
                  Manage documents <ChevronRight className="h-3 w-3" />
                </Link>
                <Link href="/chat" className="text-xs text-accent hover:underline flex items-center gap-1">
                  Open Chat <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGate>
  );
}
