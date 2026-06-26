'use client';

import { ChangeEvent, DragEvent, useCallback, useEffect, useRef, useState } from 'react';
import AuthGate        from '@/components/app/AuthGate';
import DocumentCard    from '@/components/app/DocumentCard';
import CollectionPicker from '@/components/app/CollectionPicker';
import EmptyState      from '@/components/app/EmptyState';
import ConfirmModal    from '@/components/app/ConfirmModal';
import { useCollections } from '@/lib/use-collections';
import { DocumentMeta } from '@/lib/types';
import { toast } from '@/components/app/Toast';
import {
  Upload, FileText, RefreshCw, Download, Search,
  CheckCircle2, AlertCircle, Loader2, X, SortAsc,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ACCEPT = '.pdf,.txt,.md,.csv,.json,.ts,.js,.py,.html,.xml,.markdown';

interface UploadItem { file: File; status: 'queued'|'uploading'|'done'|'error'; message: string; }

export default function DocumentsPage() { return <AuthGate><DocumentsInner /></AuthGate>; }

function DocumentsInner() {
  const { collections }   = useCollections();
  const [documents,   setDocuments]   = useState<DocumentMeta[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [filterCol,   setFilterCol]   = useState<string | undefined>();
  const [search,      setSearch]      = useState('');
  const [uploads,     setUploads]     = useState<UploadItem[]>([]);
  const [dragging,    setDragging]    = useState(false);
  const [selected,    setSelected]    = useState<Set<string>>(new Set());
  const [uploadColId, setUploadColId] = useState<string | undefined>();
  const [sortBy,      setSortBy]      = useState<'date'|'name'|'size'>('date');
  const [confirmId,   setConfirmId]   = useState<string | null>(null);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const colMap = Object.fromEntries(collections.map((c) => [c.id, c.name]));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = '/api/documents' + (filterCol ? `?collectionId=${filterCol}` : '');
      const res = await fetch(url);
      const d   = await res.json();
      setDocuments(d.documents ?? []);
    } catch { toast.error('Failed to load documents'); }
    finally { setLoading(false); }
  }, [filterCol]);

  useEffect(() => { load(); }, [load]);

  const uploadFiles = async (files: File[]) => {
    const colId = uploadColId ?? collections[0]?.id ?? '';
    if (!colId) { toast.error('Create a collection first in the Collections page.'); return; }

    const items: UploadItem[] = files.map((f) => ({ file: f, status: 'queued' as const, message: '' }));
    setUploads((p) => [...p, ...items]);

    for (const item of items) {
      setUploads((p) => p.map((u) => u.file === item.file ? { ...u, status: 'uploading' } : u));
      try {
        const fd = new FormData();
        fd.append('file', item.file);
        fd.append('collectionId', colId);
        const res  = await fetch('/api/ingest', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Upload failed');
        setUploads((p) => p.map((u) => u.file === item.file ? { ...u, status: 'done', message: `${data.document?.chunkCount ?? 0} chunks` } : u));
        toast.success(`${item.file.name} indexed`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed';
        setUploads((p) => p.map((u) => u.file === item.file ? { ...u, status: 'error', message: msg } : u));
        toast.error(`${item.file.name}: ${msg}`);
      }
    }
    load();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragging(false);
    uploadFiles(Array.from(e.dataTransfer.files));
  };
  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) uploadFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const deleteDoc = async (id: string) => {
    const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Document deleted'); load(); } else toast.error('Delete failed');
  };

  const bulkDelete = async () => {
    await Promise.all([...selected].map((id) => fetch(`/api/documents/${id}`, { method: 'DELETE' })));
    setSelected(new Set()); load();
    toast.success(`${selected.size} document(s) deleted`);
  };

  const toggleSelect = (id: string) =>
    setSelected((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const selectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((d) => d.id)));
  };

  let filtered = documents.filter((d) =>
    !search || d.name.toLowerCase().includes(search.toLowerCase())
  );

  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'size') return b.size - a.size;
    return b.createdAt.localeCompare(a.createdAt);
  });

  const uploadsInProgress = uploads.filter((u) => u.status === 'uploading' || u.status === 'queued').length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {documents.length} indexed · {documents.filter((d) => d.status === 'ready').length} ready
            {uploadsInProgress > 0 && ` · ${uploadsInProgress} uploading`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CollectionPicker collections={collections} value={filterCol} onChange={setFilterCol} placeholder="All collections" />
          {selected.size > 0 && (
            <button onClick={() => setConfirmBulk(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-danger/30 bg-danger/10 text-danger text-xs font-medium hover:bg-danger/20 transition-colors">
              Delete {selected.size}
            </button>
          )}
          <button onClick={() => { window.location.href = '/api/export/documents'; }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-bg-card text-text-secondary text-xs font-medium hover:bg-bg-hover transition-colors">
            <Download className="w-3.5 h-3.5" />Export CSV
          </button>
          <button onClick={load}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-border text-text-muted hover:bg-bg-hover transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Upload zone */}
      <div className="mb-6 glass rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <div>
            <p className="text-sm font-semibold">Upload Documents</p>
            <p className="text-xs text-text-muted">PDF, TXT, Markdown, CSV, JSON, code files · Max 20MB each</p>
          </div>
          <div className="sm:ml-auto">
            <CollectionPicker collections={collections} value={uploadColId} onChange={setUploadColId} placeholder="Select collection…" />
          </div>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInput.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed py-10 flex flex-col items-center justify-center gap-3 transition-colors select-none ${
            dragging ? 'border-blue-500/60 bg-blue-500/5' : 'border-border hover:border-blue-500/30 hover:bg-white/2'
          }`}>
          <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/25 flex items-center justify-center">
            <Upload className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">Drop files here or <span className="text-blue-400">browse</span></p>
            <p className="text-xs text-text-muted mt-0.5">Multiple files · Drag from desktop</p>
          </div>
          <input ref={fileInput} type="file" accept={ACCEPT} multiple className="hidden" onChange={handleInput} />
        </div>

        <AnimatePresence initial={false}>
          {uploads.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 space-y-1.5 overflow-hidden">
              {uploads.map((u, i) => (
                <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-bg-secondary/60 text-xs">
                  {u.status === 'done'      && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  {u.status === 'error'     && <AlertCircle  className="w-3.5 h-3.5 text-danger shrink-0" />}
                  {u.status === 'uploading' && <Loader2      className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />}
                  {u.status === 'queued'    && <span className="w-3.5 h-3.5 rounded-full border border-text-muted shrink-0 inline-block" />}
                  <span className="flex-1 truncate text-text-secondary">{u.file.name}</span>
                  {u.message && <span className={u.status === 'error' ? 'text-danger' : 'text-emerald-400'}>{u.message}</span>}
                </div>
              ))}
              <button onClick={() => setUploads([])} className="text-[10px] text-text-muted hover:text-text-secondary flex items-center gap-1 mt-1">
                <X className="w-3 h-3" />Clear log
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search documents…"
            className="w-full bg-bg-card border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm placeholder:text-text-muted focus:outline-none focus:border-blue-500/40 transition" />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1 rounded-lg border border-border overflow-hidden shrink-0">
          <SortAsc className="w-3.5 h-3.5 text-text-muted ml-2.5" />
          {(['date','name','size'] as const).map((s) => (
            <button key={s} onClick={() => setSortBy(s)}
              className={`px-2.5 py-2 text-xs capitalize transition-colors ${sortBy === s ? 'bg-blue-600/15 text-blue-400' : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'}`}>
              {s}
            </button>
          ))}
        </div>

        {filtered.length > 0 && (
          <button onClick={selectAll}
            className="px-3 py-2 rounded-lg border border-border text-xs text-text-secondary hover:bg-bg-hover transition-colors shrink-0">
            {selected.size === filtered.length ? 'Deselect all' : `Select all (${filtered.length})`}
          </button>
        )}
      </div>

      {/* List */}
      {loading
        ? <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-blue-400" /></div>
        : filtered.length === 0
        ? <EmptyState icon={FileText} title={search ? 'No results' : 'No documents yet'}
            desc={search ? 'Try a different search term.' : 'Upload files above to start indexing.'}
            actions={search ? [{ label: 'Clear search', onClick: () => setSearch(''), variant: 'secondary' }] : []}
          />
        : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {filtered.map((doc) => (
                <DocumentCard key={doc.id} doc={doc}
                  collectionName={colMap[doc.collectionId]}
                  selected={selected.has(doc.id)}
                  onSelect={toggleSelect}
                  onDelete={(id) => setConfirmId(id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )
      }

      {/* Confirm modals */}
      <ConfirmModal
        open={!!confirmId} danger
        title="Delete Document"
        message="This will permanently remove the document and all its indexed chunks. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => confirmId && deleteDoc(confirmId)}
        onClose={() => setConfirmId(null)}
      />
      <ConfirmModal
        open={confirmBulk} danger
        title={`Delete ${selected.size} Document${selected.size !== 1 ? 's' : ''}`}
        message={`All ${selected.size} selected documents and their indexed chunks will be permanently deleted.`}
        confirmLabel="Delete All"
        onConfirm={bulkDelete}
        onClose={() => setConfirmBulk(false)}
      />
    </div>
  );
}
