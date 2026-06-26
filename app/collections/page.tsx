'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import AuthGate from '@/components/app/AuthGate';
import { Collection, DocumentMeta } from '@/lib/types';
import { toast } from '@/components/app/Toast';
import {
  FolderOpen, Plus, Trash2, Pencil, Check, X,
  Download, RefreshCw, Loader2, MessageSquare,
} from 'lucide-react';
import { formatBytes } from '@/lib/utils';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function CollectionsPage() { return <AuthGate><CollectionsInner /></AuthGate>; }

function CollectionsInner() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [documents,   setDocuments]   = useState<DocumentMeta[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [creating,    setCreating]    = useState(false);
  const [newName,     setNewName]     = useState('');
  const [newDesc,     setNewDesc]     = useState('');
  const [editId,      setEditId]      = useState<string | null>(null);
  const [editName,    setEditName]    = useState('');
  const [editDesc,    setEditDesc]    = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cr, dr] = await Promise.all([fetch('/api/collections'), fetch('/api/documents')]);
      const cd = await cr.json(); const dd = await dr.json();
      setCollections(cd.collections ?? []); setDocuments(dd.documents ?? []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const res  = await fetch('/api/collections', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() }) });
    if (res.ok) { toast.success('Collection created'); setNewName(''); setNewDesc(''); setCreating(false); load(); }
    else { const d = await res.json(); toast.error(d.error ?? 'Create failed'); }
  };

  const saveEdit = async (id: string) => {
    const res = await fetch(`/api/collections/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: editName.trim(), description: editDesc.trim() }) });
    if (res.ok) { toast.success('Saved'); setEditId(null); load(); }
    else toast.error('Save failed');
  };

  const del = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}" and all its documents?`)) return;
    const res = await fetch(`/api/collections/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Deleted'); load(); } else toast.error('Delete failed');
  };

  const colStats = (col: Collection) => {
    const docs  = documents.filter((d) => d.collectionId === col.id);
    const size  = docs.reduce((s, d) => s + d.size, 0);
    const chunks = docs.reduce((s, d) => s + d.chunkCount, 0);
    return { docs: docs.length, size: formatBytes(size), chunks };
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-7">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Collections</h1>
          <p className="text-sm text-text-muted mt-0.5">Organize documents into logical workspaces</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { window.location.href = '/api/export/collections'; }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-bg-card text-text-secondary text-xs font-medium hover:bg-bg-hover transition-colors">
            <Download className="w-3.5 h-3.5" />Export JSON
          </button>
          <button onClick={load}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-border text-text-muted hover:bg-bg-hover transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors">
            <Plus className="w-3.5 h-3.5" />New Collection
          </button>
        </div>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {creating && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mb-5 overflow-hidden">
            <form onSubmit={create} className="glass rounded-2xl p-5 space-y-3">
              <p className="text-sm font-semibold">Create Collection</p>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Collection name" required
                className="w-full bg-bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm placeholder:text-text-muted focus:outline-none focus:border-blue-500/50 transition" />
              <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Description (optional)"
                className="w-full bg-bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm placeholder:text-text-muted focus:outline-none focus:border-blue-500/50 transition" />
              <div className="flex gap-2">
                <button type="submit" className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors">
                  <Plus className="w-3.5 h-3.5" />Create
                </button>
                <button type="button" onClick={() => setCreating(false)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-text-secondary text-xs font-medium hover:bg-bg-hover transition-colors">
                  <X className="w-3.5 h-3.5" />Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {loading
        ? <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-blue-400" /></div>
        : collections.length === 0
        ? (
          <div className="flex flex-col items-center py-16 text-center gap-3">
            <FolderOpen className="w-8 h-8 text-text-muted" />
            <p className="text-sm font-medium">No collections yet</p>
            <p className="text-xs text-text-muted">Create a collection to start organizing your documents.</p>
          </div>
        )
        : (
          <div className="grid gap-4 sm:grid-cols-2">
            <AnimatePresence initial={false}>
              {collections.map((col) => {
                const stats = colStats(col);
                const isEditing = editId === col.id;
                return (
                  <motion.div key={col.id} layout
                    className="glass rounded-2xl p-5 border border-border hover:border-blue-500/25 transition-all card-glow group">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-600/15 border border-blue-500/25 flex items-center justify-center shrink-0">
                        <FolderOpen className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <div className="space-y-2">
                            <input value={editName} onChange={(e) => setEditName(e.target.value)}
                              className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500/50 transition" />
                            <input value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
                              className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500/50 transition" placeholder="Description…" />
                            <div className="flex gap-1.5">
                              <button onClick={() => saveEdit(col.id)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 transition-colors">
                                <Check className="w-3 h-3" />Save
                              </button>
                              <button onClick={() => setEditId(null)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border text-text-secondary text-xs hover:bg-bg-hover transition-colors">
                                <X className="w-3 h-3" />Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm font-semibold truncate">{col.name}</p>
                            {col.description && <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{col.description}</p>}
                          </>
                        )}
                      </div>
                      {!isEditing && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditId(col.id); setEditName(col.name); setEditDesc(col.description ?? ''); }}
                            className="h-7 w-7 flex items-center justify-center rounded-lg text-text-muted hover:text-blue-400 hover:bg-blue-500/10 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => del(col.id, col.name)}
                            className="h-7 w-7 flex items-center justify-center rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-3 mb-4">
                      {[
                        { label: 'Docs',   value: stats.docs   },
                        { label: 'Chunks', value: stats.chunks },
                        { label: 'Size',   value: stats.size   },
                      ].map((s) => (
                        <div key={s.label} className="bg-bg-secondary/50 rounded-lg px-2.5 py-2 text-center">
                          <p className="text-sm font-bold text-text-primary">{s.value}</p>
                          <p className="text-[10px] text-text-muted">{s.label}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/chat?collection=${col.id}`}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-600/10 border border-blue-500/25 text-blue-400 text-xs font-medium hover:bg-blue-600/20 transition-colors">
                        <MessageSquare className="w-3.5 h-3.5" />Chat
                      </Link>
                      <a href={`/api/export/collections`}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-border text-text-secondary text-xs font-medium hover:bg-bg-hover transition-colors">
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )
      }
    </div>
  );
}
