'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle, CheckCircle2, FileText, Loader2, RefreshCw,
  Search, Trash2, UploadCloud, X, File, FileCode, Database,
  Eye, MessageSquare, Plus, Filter, ArrowUpDown,
  ChevronDown, ChevronUp, Hash, FolderOpen, Layers, Zap,
  Clock, Download,
} from 'lucide-react';
import CollectionPicker from '@/components/app/CollectionPicker';
import AuthGate from '@/components/app/AuthGate';
import { useCollections } from '@/lib/use-collections';
import { Collection, DocumentMeta } from '@/lib/types';
import { formatBytes, relativeTime } from '@/lib/utils';

type Notice = { type: 'success' | 'error'; text: string } | null;
type SortField = 'name' | 'size' | 'createdAt' | 'status';
type SortDir = 'asc' | 'desc';

function statusClass(status: DocumentMeta['status']) {
  if (status === 'ready') return 'text-success bg-success/10 border-success/20';
  if (status === 'processing') return 'text-accent bg-accent/10 border-accent/20';
  return 'text-danger bg-danger/10 border-danger/20';
}

function getFileExt(type: string, name: string) {
  if (name.toLowerCase().endsWith('.pdf')) return 'PDF';
  return name.split('.').pop()?.toUpperCase() || type.split('/').pop()?.toUpperCase() || 'FILE';
}

function FileTypeIcon({ type, name }: { type: string; name: string }) {
  const ext = getFileExt(type, name).toLowerCase();
  if (ext === 'pdf') return <span className="text-red-400 font-bold text-[9px] bg-red-400/10 rounded px-1 py-0.5">PDF</span>;
  if (['md', 'txt'].includes(ext)) return <File className="h-3.5 w-3.5 text-blue-400" />;
  if (['csv', 'json'].includes(ext)) return <Database className="h-3.5 w-3.5 text-green-400" />;
  if (['js', 'ts', 'tsx', 'jsx', 'py', 'rs', 'go', 'java', 'c', 'cpp'].includes(ext)) return <FileCode className="h-3.5 w-3.5 text-purple-400" />;
  return <Hash className="h-3.5 w-3.5 text-text-muted" />;
}

function collectionName(collections: Collection[], id: string) {
  return collections.find(c => c.id === id)?.name || 'Unknown';
}

// ── Preview modal ──────────────────────────────────────────────────────────────
function PreviewModal({ doc, onClose }: { doc: DocumentMeta; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ chunkCount: number; chunks: { index: number; text: string }[] } | null>(null);
  const [activeChunk, setActiveChunk] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/documents/${doc.id}/preview`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); } else { setData(d); }
      })
      .catch(() => setError('Could not load preview'))
      .finally(() => setLoading(false));
  }, [doc.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 border border-accent/20">
            <FileText className="h-4 w-4 text-accent" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-sm truncate">{doc.name}</h2>
            <p className="text-[11px] text-text-muted">{getFileExt(doc.type, doc.name)} · {formatBytes(doc.size)} · {doc.chunkCount} chunks</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/chat?collectionId=${doc.collectionId}`}
              className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[11px] font-semibold text-white hover:opacity-90 transition-opacity"
            >
              <MessageSquare className="h-3 w-3" /> Ask AI
            </Link>
            <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {loading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
            </div>
          ) : error ? (
            <div className="flex flex-1 items-center justify-center text-center p-8">
              <div>
                <AlertCircle className="h-8 w-8 text-danger mx-auto mb-2 opacity-60" />
                <p className="text-sm text-danger">{error}</p>
                {doc.status === 'error' && doc.error && (
                  <p className="text-xs text-text-muted mt-2 max-w-sm">{doc.error}</p>
                )}
              </div>
            </div>
          ) : data && data.chunks.length > 0 ? (
            <>
              {/* Chunk list */}
              <div className="w-40 shrink-0 border-r border-border bg-bg-secondary/30 overflow-y-auto">
                <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted border-b border-border">
                  {data.chunkCount} chunks
                </p>
                {data.chunks.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveChunk(i)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-[11px] transition-colors ${
                      activeChunk === i ? 'bg-accent/10 text-accent' : 'text-text-secondary hover:bg-bg-hover'
                    }`}
                  >
                    <span className="shrink-0 font-mono">{String(c.index + 1).padStart(2, '0')}</span>
                    <span className="truncate">{c.text.slice(0, 30)}…</span>
                  </button>
                ))}
                {data.chunkCount > data.chunks.length && (
                  <p className="px-3 py-2 text-[10px] text-text-muted">+{data.chunkCount - data.chunks.length} more…</p>
                )}
              </div>
              {/* Chunk content */}
              <div className="flex-1 overflow-y-auto p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                    Chunk {data.chunks[activeChunk].index + 1}
                  </span>
                  <div className="flex gap-1">
                    <button disabled={activeChunk === 0} onClick={() => setActiveChunk(i => i - 1)} className="p-1 rounded text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors"><ChevronUp className="h-3.5 w-3.5" /></button>
                    <button disabled={activeChunk === data.chunks.length - 1} onClick={() => setActiveChunk(i => i + 1)} className="p-1 rounded text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors"><ChevronDown className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <pre className="text-xs leading-relaxed text-text-primary whitespace-pre-wrap font-mono bg-bg-secondary/30 rounded-xl p-4 border border-border">
                  {data.chunks[activeChunk].text}
                </pre>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-sm text-text-muted">No chunks available for preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Document row ──────────────────────────────────────────────────────────────
function DocRow({
  doc, collections, selected, onSelect, onDelete, onPreview,
}: {
  doc: DocumentMeta; collections: Collection[];
  selected: boolean; onSelect: (id: string, checked: boolean) => void;
  onDelete: (id: string) => void; onPreview: (doc: DocumentMeta) => void;
}) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 border-b border-border/50 hover:bg-bg-hover/50 transition-colors group ${selected ? 'bg-accent/5' : ''}`}>
      <input
        type="checkbox" checked={selected} onChange={e => onSelect(doc.id, e.target.checked)}
        className="h-3.5 w-3.5 rounded border-border accent-accent shrink-0"
      />
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bg-secondary border border-border">
        <FileTypeIcon type={doc.type} name={doc.name} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">{doc.name}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
          <span className="text-[11px] text-text-muted">{collectionName(collections, doc.collectionId)}</span>
          <span className="text-[11px] text-text-muted">{formatBytes(doc.size)}</span>
          {doc.chunkCount > 0 && <span className="text-[11px] text-text-muted">{doc.chunkCount} chunks</span>}
          <span className="text-[11px] text-text-muted">{relativeTime(doc.createdAt)}</span>
        </div>
        {doc.error && <p className="text-[11px] text-danger mt-0.5 truncate">{doc.error}</p>}
      </div>
      <span className={`hidden sm:inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium shrink-0 ${statusClass(doc.status)}`}>
        {doc.status === 'processing' && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
        {doc.status === 'ready' && <span className="h-1.5 w-1.5 rounded-full bg-success" />}
        {doc.status === 'error' && <span className="h-1.5 w-1.5 rounded-full bg-danger" />}
        {doc.status}
      </span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {doc.status === 'ready' && (
          <button onClick={() => onPreview(doc)} title="Preview chunks" className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-card transition-colors">
            <Eye className="h-3.5 w-3.5" />
          </button>
        )}
        <Link href={`/chat?collectionId=${doc.collectionId}`} title="Chat" className="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-colors">
          <MessageSquare className="h-3.5 w-3.5" />
        </Link>
        <button onClick={() => onDelete(doc.id)} title="Delete" className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Upload zone ───────────────────────────────────────────────────────────────
function UploadZone({
  collectionId, collections, onCreate, onNotice,
}: {
  collectionId: string; collections: Collection[];
  onCreate: (doc: DocumentMeta) => void; onNotice: (n: Notice) => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<Record<string, 'pending' | 'uploading' | 'done' | 'error'>>({});
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [targetCollection, setTargetCollection] = useState(collectionId);

  useEffect(() => { setTargetCollection(collectionId); }, [collectionId]);

  const addFiles = (added: FileList | File[]) => {
    const arr = Array.from(added);
    setFiles(prev => {
      const names = new Set(prev.map(f => f.name));
      return [...prev, ...arr.filter(f => !names.has(f.name))];
    });
  };

  const uploadAll = async () => {
    if (!files.length || !targetCollection) {
      onNotice({ type: 'error', text: 'Select a collection first.' });
      return;
    }
    setUploading(true);
    const initial: Record<string, 'pending' | 'uploading' | 'done' | 'error'> = {};
    files.forEach(f => initial[f.name] = 'pending');
    setProgress(initial);

    for (const file of files) {
      setProgress(p => ({ ...p, [file.name]: 'uploading' }));
      const form = new FormData();
      form.append('file', file);
      form.append('collectionId', targetCollection);
      try {
        const res = await fetch('/api/ingest', { method: 'POST', body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        setProgress(p => ({ ...p, [file.name]: 'done' }));
        if (data.document) onCreate(data.document);
      } catch (err) {
        setProgress(p => ({ ...p, [file.name]: 'error' }));
        onNotice({ type: 'error', text: err instanceof Error ? err.message : `Failed: ${file.name}` });
      }
    }
    setUploading(false);
    const finalProgress = { ...progress };
    files.forEach(f => { if (finalProgress[f.name] !== 'error') finalProgress[f.name] = 'done'; });
    const successCount = files.filter(f => finalProgress[f.name] === 'done').length;
    if (successCount > 0) onNotice({ type: 'success', text: `${successCount} file${successCount > 1 ? 's' : ''} indexed successfully.` });
    setTimeout(() => { setFiles([]); setProgress({}); }, 2000);
  };

  return (
    <div className="space-y-3">
      {/* Collection picker */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-text-secondary shrink-0">Collection</label>
        <CollectionPicker collections={collections} value={targetCollection} onChange={setTargetCollection} includeAll />
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed cursor-pointer transition-all py-8 px-4 ${
          dragOver ? 'border-accent bg-accent/8 scale-[1.01]' : 'border-border hover:border-accent/40 hover:bg-bg-hover/30'
        }`}
      >
        <UploadCloud className={`h-8 w-8 transition-colors ${dragOver ? 'text-accent' : 'text-text-muted'}`} />
        <div className="text-center">
          <p className="text-sm font-medium">{dragOver ? 'Drop to add' : 'Drop files or click to browse'}</p>
          <p className="text-xs text-text-muted mt-0.5">PDF, MD, TXT, CSV, JSON, code files · Max 15MB each</p>
        </div>
        <input ref={inputRef} type="file" multiple accept=".pdf,.txt,.md,.markdown,.csv,.json,.js,.ts,.tsx,.jsx,.py,.java,.c,.cpp,.go,.rs,.rb,.php,.html,.css,.yml,.yaml,.xml,.sql,.log" className="hidden"
          onChange={e => e.target.files && addFiles(e.target.files)} />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map(f => {
            const status = progress[f.name];
            return (
              <div key={f.name} className="flex items-center gap-3 rounded-xl border border-border bg-bg-card/60 px-3 py-2.5">
                <FileTypeIcon type={f.type} name={f.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{f.name}</p>
                  <p className="text-[10px] text-text-muted">{formatBytes(f.size)}</p>
                </div>
                {!status && (
                  <button onClick={e => { e.stopPropagation(); setFiles(prev => prev.filter(x => x.name !== f.name)); }}
                    className="p-1 rounded text-text-muted hover:text-danger transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                {status === 'uploading' && <Loader2 className="h-4 w-4 animate-spin text-accent shrink-0" />}
                {status === 'done' && <CheckCircle2 className="h-4 w-4 text-success shrink-0" />}
                {status === 'error' && <AlertCircle className="h-4 w-4 text-danger shrink-0" />}
              </div>
            );
          })}
        </div>
      )}

      {files.length > 0 && (
        <button
          onClick={uploadAll}
          disabled={uploading || !targetCollection}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Indexing…</> : <><Zap className="h-4 w-4" /> Upload and index {files.length} file{files.length > 1 ? 's' : ''}</>}
        </button>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function DocumentsPage() {
  const { collections, refresh: refreshCollections } = useCollections();
  const [docs, setDocs] = useState<DocumentMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<Notice>(null);
  const [filterCollection, setFilterCollection] = useState('');
  const [filterStatus, setFilterStatus] = useState<'' | 'ready' | 'error' | 'processing'>('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [previewDoc, setPreviewDoc] = useState<DocumentMeta | null>(null);
  const [showUpload, setShowUpload] = useState(true);

  const loadDocs = useCallback(async () => {
    try {
      const url = filterCollection ? `/api/documents?collectionId=${filterCollection}` : '/api/documents';
      const r = await fetch(url);
      const d = await r.json();
      setDocs(d.documents || []);
    } catch {
      setNotice({ type: 'error', text: 'Could not load documents.' });
    } finally { setLoading(false); }
  }, [filterCollection]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  // Auto-refresh processing docs
  useEffect(() => {
    const hasProcessing = docs.some(d => d.status === 'processing');
    if (!hasProcessing) return;
    const t = setInterval(loadDocs, 3000);
    return () => clearInterval(t);
  }, [docs, loadDocs]);

  const deleteDoc = async (id: string) => {
    if (!confirm('Delete this document? This cannot be undone.')) return;
    await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    setDocs(prev => prev.filter(d => d.id !== id));
    setSelected(prev => { const s = new Set(prev); s.delete(id); return s; });
    setNotice({ type: 'success', text: 'Document deleted.' });
  };

  const deleteSelected = async () => {
    if (!confirm(`Delete ${selected.size} documents?`)) return;
    for (const id of selected) {
      await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    }
    setDocs(prev => prev.filter(d => !selected.has(d.id)));
    setSelected(new Set());
    setNotice({ type: 'success', text: `${selected.size} documents deleted.` });
  };

  const handleSelect = (id: string, checked: boolean) => {
    setSelected(prev => { const s = new Set(prev); checked ? s.add(id) : s.delete(id); return s; });
  };

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(filtered.map(d => d.id)) : new Set());
  };

  const toggleSort = (field: SortField) => {
    if (sort === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSort(field); setSortDir('desc'); }
  };

  const filtered = useMemo(() => {
    let list = [...docs];
    if (filterCollection) list = list.filter(d => d.collectionId === filterCollection);
    if (filterStatus) list = list.filter(d => d.status === filterStatus);
    if (search) list = list.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));
    list.sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1;
      if (sort === 'name') return mul * a.name.localeCompare(b.name);
      if (sort === 'size') return mul * (a.size - b.size);
      if (sort === 'status') return mul * a.status.localeCompare(b.status);
      return mul * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    });
    return list;
  }, [docs, filterCollection, filterStatus, search, sort, sortDir]);

  const readyCount = docs.filter(d => d.status === 'ready').length;
  const errorCount = docs.filter(d => d.status === 'error').length;
  const totalSize = docs.reduce((s, d) => s + d.size, 0);
  const totalChunks = docs.reduce((s, d) => s + d.chunkCount, 0);

  const SortBtn = ({ field, label }: { field: SortField; label: string }) => (
    <button onClick={() => toggleSort(field)} className="flex items-center gap-1 text-[11px] font-semibold text-text-muted hover:text-text-primary transition-colors">
      {label}
      {sort === field ? (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
    </button>
  );

  return (
    <AuthGate>
      <div className="min-h-screen pb-24 lg:pb-8">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">

          {/* Header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-mono font-bold tracking-widest text-text-muted">DOCUMENT VAULT</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">Upload &amp; Manage Documents</h1>
              <p className="mt-1 text-sm text-text-secondary">Add PDFs, notes, datasets, markdown, and code files. DocuMind chunks and embeds them for cited answers.</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link href="/collections" className="flex items-center gap-1.5 rounded-xl border border-border bg-bg-card px-3 py-2 text-xs font-medium text-text-secondary hover:text-text-primary hover:border-border/80 transition-colors">
                <FolderOpen className="h-3.5 w-3.5" /> Collections
              </Link>
              <button onClick={loadDocs} className="flex items-center gap-1.5 rounded-xl border border-border bg-bg-card px-3 py-2 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors">
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </button>
            </div>
          </div>

          {/* Notice */}
          {notice && (
            <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${notice.type === 'success' ? 'border-success/25 bg-success/10 text-success' : 'border-danger/25 bg-danger/10 text-danger'}`}>
              {notice.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
              <span>{notice.text}</span>
              <button onClick={() => setNotice(null)} className="ml-auto"><X className="h-4 w-4" /></button>
            </div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Ready', value: readyCount, color: 'text-success', icon: CheckCircle2 },
              { label: 'Errors', value: errorCount, color: 'text-danger', icon: AlertCircle },
              { label: 'Total Chunks', value: totalChunks.toLocaleString(), color: 'text-accent', icon: Layers },
              { label: 'Stored', value: formatBytes(totalSize), color: 'text-text-primary', icon: Database },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="glass rounded-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-text-muted">{label}</p>
                  <Icon className={`h-3.5 w-3.5 ${color} opacity-60`} />
                </div>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            {/* Upload panel */}
            <div className="lg:col-span-2">
              <div className="glass rounded-2xl p-5 space-y-4 sticky top-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-sm flex items-center gap-2"><UploadCloud className="h-4 w-4 text-accent" /> Add Document</h2>
                  <button onClick={() => setShowUpload(o => !o)} className="text-text-muted hover:text-text-primary transition-colors">
                    {showUpload ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
                {showUpload && (
                  <UploadZone
                    collectionId={filterCollection}
                    collections={collections}
                    onCreate={doc => { setDocs(prev => [doc, ...prev]); refreshCollections(); }}
                    onNotice={setNotice}
                  />
                )}
                <div className="pt-2 border-t border-border/50">
                  <p className="text-[11px] text-text-muted font-medium mb-2">SUPPORTED FORMATS</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['PDF', 'MD', 'TXT', 'CSV', 'JSON', 'JS/TS', 'Python', 'SQL', 'YAML', 'HTML'].map(f => (
                      <span key={f} className="rounded-md border border-border/60 bg-bg-secondary/40 px-2 py-0.5 text-[10px] font-mono text-text-muted">{f}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Document list */}
            <div className="lg:col-span-3 space-y-3">
              {/* Toolbar */}
              <div className="glass rounded-xl px-4 py-3 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter filenames…"
                      className="w-full rounded-lg border border-border bg-bg-secondary/50 pl-8 pr-3 py-1.5 text-xs outline-none focus:border-accent/50 transition-colors" />
                  </div>
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}
                    className="rounded-lg border border-border bg-bg-secondary/50 px-2.5 py-1.5 text-xs text-text-secondary outline-none focus:border-accent/50 transition-colors">
                    <option value="">All status</option>
                    <option value="ready">Ready</option>
                    <option value="processing">Processing</option>
                    <option value="error">Error</option>
                  </select>
                  <select value={filterCollection} onChange={e => setFilterCollection(e.target.value)}
                    className="rounded-lg border border-border bg-bg-secondary/50 px-2.5 py-1.5 text-xs text-text-secondary outline-none focus:border-accent/50 transition-colors">
                    <option value="">All collections</option>
                    {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="flex items-center justify-between text-[11px] text-text-muted">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0}
                        onChange={e => toggleAll(e.target.checked)} className="h-3 w-3 rounded accent-accent" />
                      {selected.size > 0 ? `${selected.size} selected` : 'Select all'}
                    </label>
                    {selected.size > 0 && (
                      <button onClick={deleteSelected} className="flex items-center gap-1 text-danger hover:text-danger/80 transition-colors">
                        <Trash2 className="h-3 w-3" /> Delete selected
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <SortBtn field="name" label="Name" />
                    <SortBtn field="size" label="Size" />
                    <SortBtn field="createdAt" label="Date" />
                    <SortBtn field="status" label="Status" />
                  </div>
                </div>
              </div>

              {/* Header */}
              <div className="glass rounded-xl overflow-hidden">
                <div className="border-b border-border px-4 py-2.5 flex items-center justify-between">
                  <p className="text-xs font-semibold text-text-secondary">
                    Indexed documents
                    <span className="ml-2 text-text-muted font-normal">Auto-refreshes every 3s · {filtered.length} shown</span>
                  </p>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-accent" />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                    <FileText className="h-12 w-12 text-text-muted opacity-30 mb-3" />
                    <p className="font-medium text-text-secondary">
                      {docs.length === 0 ? 'No documents yet' : 'No documents match your filters'}
                    </p>
                    <p className="text-sm text-text-muted mt-1">
                      {docs.length === 0 ? 'Upload your first file to get started.' : 'Try adjusting your search or filters.'}
                    </p>
                  </div>
                ) : (
                  filtered.map(doc => (
                    <DocRow
                      key={doc.id} doc={doc} collections={collections}
                      selected={selected.has(doc.id)}
                      onSelect={handleSelect}
                      onDelete={deleteDoc}
                      onPreview={setPreviewDoc}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {previewDoc && <PreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />}
    </AuthGate>
  );
}
