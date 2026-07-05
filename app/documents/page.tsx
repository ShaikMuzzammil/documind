'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle, CheckCircle2, FileText, FolderPlus, Loader2,
  RefreshCw, Search, Trash2, UploadCloud, X, ChevronDown,
  File, FileCode, Database, Hash, Eye, MessageSquare, Plus,
  Filter, ArrowUpDown, ChevronUp,
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
  if (status === 'processing') return 'text-accent-2 bg-accent-2/10 border-accent-2/20';
  return 'text-danger bg-danger/10 border-danger/20';
}

function getFileExt(type: string, name: string): string {
  if (name.toLowerCase().endsWith('.pdf')) return 'PDF';
  const nameExt = name.split('.').pop()?.toLowerCase() || '';
  if (nameExt) return nameExt.toUpperCase();
  return type.split('/').pop()?.toUpperCase() || 'FILE';
}

function FileTypeIcon({ type, name }: { type: string; name: string }) {
  const ext = getFileExt(type, name).toLowerCase();
  if (ext === 'pdf') return <div className="text-red-400 font-bold text-[10px] bg-red-400/10 rounded px-1 py-0.5">PDF</div>;
  if (['md', 'txt'].includes(ext)) return <File className="h-3.5 w-3.5 text-blue-400" />;
  if (['csv', 'json'].includes(ext)) return <Database className="h-3.5 w-3.5 text-green-400" />;
  if (['js', 'ts', 'tsx', 'jsx', 'py', 'rs', 'go', 'java', 'c', 'cpp'].includes(ext)) return <FileCode className="h-3.5 w-3.5 text-purple-400" />;
  return <Hash className="h-3.5 w-3.5 text-text-muted" />;
}

function collectionName(collections: Collection[], id: string) {
  return collections.find((c) => c.id === id)?.name || 'Unknown';
}

// Document detail modal
function DocumentModal({ doc, onClose }: { doc: DocumentMeta; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
              <FileText className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight">{doc.name}</h2>
              <p className="text-xs text-text-muted mt-0.5">{getFileExt(doc.type, doc.name)} · {formatBytes(doc.size)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Status', value: doc.status, isStatus: true },
            { label: 'Chunks', value: String(doc.chunkCount) },
            { label: 'Size', value: formatBytes(doc.size) },
            { label: 'Indexed', value: relativeTime(doc.createdAt) },
          ].map(({ label, value, isStatus }) => (
            <div key={label} className="rounded-xl bg-bg-secondary/60 border border-border/50 px-3 py-2.5">
              <p className="text-xs text-text-muted mb-1">{label}</p>
              {isStatus ? (
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusClass(doc.status as DocumentMeta['status'])}`}>
                  {doc.status === 'ready' && <div className="h-1.5 w-1.5 rounded-full bg-success" />}
                  {doc.status}
                </span>
              ) : (
                <p className="text-sm font-semibold text-text-primary">{value}</p>
              )}
            </div>
          ))}
        </div>

        {doc.error && (
          <div className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-3">
            <p className="text-xs font-semibold text-danger mb-1">Indexing error</p>
            <p className="text-xs text-danger/80">{doc.error}</p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Link
            href={`/chat?collectionId=${doc.collectionId}`}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            <MessageSquare className="h-4 w-4" /> Chat about this
          </Link>
          <Link
            href={`/search`}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-bg-card px-4 py-2.5 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors"
          >
            <Search className="h-4 w-4" /> Search docs
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  const { collections, loading: loadingCollections, create: createCollection } = useCollections();
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [collectionId, setCollectionId] = useState('');
  const [uploadCollectionId, setUploadCollectionId] = useState('');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [query, setQuery] = useState('');
  const [dragging, setDragging] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [notice, setNotice] = useState<Notice>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [viewDoc, setViewDoc] = useState<DocumentMeta | null>(null);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'error' | 'processing'>('all');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialCollectionId = params.get('collectionId');
    if (initialCollectionId) {
      setCollectionId(initialCollectionId);
      setUploadCollectionId(initialCollectionId);
    }
  }, []);

  const refreshDocuments = useCallback(async () => {
    setLoadingDocs(true);
    try {
      const params = collectionId ? `?collectionId=${encodeURIComponent(collectionId)}` : '';
      const res = await fetch(`/api/documents${params}`);
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch {
      setNotice({ type: 'error', text: 'Unable to load documents.' });
      setDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  }, [collectionId]);

  useEffect(() => {
    refreshDocuments();
    const timer = window.setInterval(refreshDocuments, 8000);
    return () => window.clearInterval(timer);
  }, [refreshDocuments]);

  useEffect(() => {
    if (!uploadCollectionId && collections.length) setUploadCollectionId(collections[0].id);
  }, [collections, uploadCollectionId]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const filteredDocuments = useMemo(() => {
    let docs = [...documents];
    const needle = query.trim().toLowerCase();
    if (needle) docs = docs.filter(d => d.name.toLowerCase().includes(needle));
    if (statusFilter !== 'all') docs = docs.filter(d => d.status === statusFilter);
    docs.sort((a, b) => {
      let va: string | number = a[sortField] as string | number;
      let vb: string | number = b[sortField] as string | number;
      if (sortField === 'size') { va = a.size; vb = b.size; }
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return docs;
  }, [documents, query, statusFilter, sortField, sortDir]);

  const stats = useMemo(() => {
    const ready = documents.filter(d => d.status === 'ready').length;
    const processing = documents.filter(d => d.status === 'processing').length;
    const errors = documents.filter(d => d.status === 'error').length;
    const chunks = documents.reduce((sum, d) => sum + d.chunkCount, 0);
    const bytes = documents.reduce((sum, d) => sum + d.size, 0);
    return { ready, processing, errors, chunks, bytes };
  }, [documents]);

  const createQuickCollection = async () => {
    const name = newCollectionName.trim();
    if (!name) return;
    const ok = await createCollection(name);
    setNotice(ok ? { type: 'success', text: 'Collection created.' } : { type: 'error', text: 'Collection could not be created.' });
    if (ok) setNewCollectionName('');
  };

  const upload = async () => {
    if (!file || !uploadCollectionId || uploading) return;
    setUploading(true);
    setUploadProgress(0);
    setNotice(null);
    const form = new FormData();
    form.append('file', file);
    form.append('collectionId', uploadCollectionId);

    const progressInterval = setInterval(() => {
      setUploadProgress(p => Math.min(p + 8, 85));
    }, 200);

    try {
      const res = await fetch('/api/ingest', { method: 'POST', body: form });
      clearInterval(progressInterval);
      setUploadProgress(100);

      let data: { document?: DocumentMeta; error?: string } = {};
      try { data = await res.json(); } catch {
        throw new Error(res.status === 413 ? 'File is too large. Try a smaller file.' : `Upload failed (${res.status}).`);
      }
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setNotice({
        type: data.document?.status === 'ready' ? 'success' : 'error',
        text: data.document?.status === 'ready'
          ? `✓ "${data.document.name}" indexed with ${data.document.chunkCount} chunks.`
          : data.document?.error || 'No extractable text was found.',
      });
      setFile(null);
      await refreshDocuments();
    } catch (err) {
      clearInterval(progressInterval);
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Upload failed.' });
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const removeDocument = async (id: string) => {
    setDeleting(id);
    const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setNotice({ type: 'success', text: 'Document removed.' });
      await refreshDocuments();
    } else {
      setNotice({ type: 'error', text: 'Document could not be removed.' });
    }
    setDeleting(null);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sortDir === 'asc' ? <ChevronUp className="h-3 w-3 text-accent" /> : <ChevronDown className="h-3 w-3 text-accent" />;
  };

  return (
    <AuthGate>
      {viewDoc && <DocumentModal doc={viewDoc} onClose={() => setViewDoc(null)} />}

      <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8 pb-24 lg:pb-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-mono font-bold tracking-widest text-text-muted">DOCUMENT VAULT</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">Upload & Manage Documents</h1>
              <p className="mt-2 max-w-2xl text-sm text-text-secondary">
                Add PDFs, notes, datasets, markdown, and code files. DocuMind chunks and embeds them for cited answers.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <CollectionPicker collections={collections} value={collectionId} onChange={setCollectionId} includeAll />
              <button
                onClick={refreshDocuments}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-bg-card px-3 text-sm text-text-secondary transition-colors hover:text-text-primary"
              >
                <RefreshCw className={`h-4 w-4 ${loadingDocs ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </header>

          {/* Stats */}
          <section className="grid gap-3 sm:grid-cols-5">
            {[
              { label: 'Ready', value: stats.ready, color: 'text-success', onClick: () => setStatusFilter(statusFilter === 'ready' ? 'all' : 'ready') },
              { label: 'Processing', value: stats.processing, color: 'text-accent-2', onClick: () => setStatusFilter(statusFilter === 'processing' ? 'all' : 'processing') },
              { label: 'Errors', value: stats.errors, color: 'text-danger', onClick: () => setStatusFilter(statusFilter === 'error' ? 'all' : 'error') },
              { label: 'Total Chunks', value: stats.chunks, color: 'text-accent', onClick: () => {} },
              { label: 'Stored', value: formatBytes(stats.bytes), color: 'text-text-primary', onClick: () => {} },
            ].map(({ label, value, color, onClick }) => (
              <button key={label} onClick={onClick} className={`glass rounded-xl p-4 text-left transition-all hover:border-accent/30 ${statusFilter === label.toLowerCase().replace(' ', '') ? 'border-accent/40 bg-accent/5' : ''}`}>
                <p className="text-xs text-text-muted">{label}</p>
                <p className={`mt-1.5 text-2xl font-bold ${color}`}>{value}</p>
              </button>
            ))}
          </section>

          {notice && (
            <div className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
              notice.type === 'success' ? 'border-success/25 bg-success/10 text-success' : 'border-danger/25 bg-danger/10 text-danger'
            }`}>
              {notice.type === 'success' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
              <span className="flex-1">{notice.text}</span>
              <button onClick={() => setNotice(null)}><X className="h-4 w-4 opacity-60 hover:opacity-100" /></button>
            </div>
          )}

          <section className="grid gap-6 xl:grid-cols-[minmax(300px,380px)_1fr]">
            {/* Upload panel */}
            <div className="space-y-4">
              <div className="glass rounded-xl p-5">
                <div className="mb-4 flex items-center gap-2">
                  <UploadCloud className="h-5 w-5 text-accent" />
                  <h2 className="font-semibold">Add Document</h2>
                </div>

                {collections.length === 0 && !loadingCollections ? (
                  <div className="rounded-lg border border-border bg-bg-secondary/50 p-4">
                    <p className="text-sm text-text-secondary mb-3">Create a collection before uploading.</p>
                    <div className="flex gap-2">
                      <input
                        value={newCollectionName}
                        onChange={(e) => setNewCollectionName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && createQuickCollection()}
                        placeholder="Research, Legal, Product..."
                        className="min-w-0 flex-1 rounded-lg border border-border bg-bg-card px-3 py-2 text-sm outline-none focus:border-accent/50"
                      />
                      <button
                        onClick={createQuickCollection}
                        disabled={!newCollectionName.trim()}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
                      >
                        <FolderPlus className="h-4 w-4" /> Create
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <label className="mb-2 block text-xs font-medium text-text-muted">Target Collection</label>
                    <CollectionPicker collections={collections} value={uploadCollectionId} onChange={setUploadCollectionId} />

                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragging(false);
                        const dropped = e.dataTransfer.files?.[0];
                        if (dropped) setFile(dropped);
                      }}
                      className={`mt-4 rounded-xl border border-dashed p-6 text-center transition-all cursor-pointer ${
                        dragging ? 'border-accent bg-accent/8 scale-[1.01]' : 'border-border bg-bg-secondary/50 hover:border-border/60'
                      }`}
                      onClick={() => document.getElementById('file-input')?.click()}
                    >
                      <UploadCloud className={`mx-auto h-8 w-8 mb-2 transition-colors ${dragging ? 'text-accent' : 'text-text-muted'}`} />
                      {file ? (
                        <div>
                          <p className="text-sm font-medium text-text-primary">{file.name}</p>
                          <p className="text-xs text-text-muted mt-1">{formatBytes(file.size)} — ready to upload</p>
                          <button
                            onClick={(e) => { e.stopPropagation(); setFile(null); }}
                            className="mt-2 text-xs text-text-muted hover:text-danger transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-medium">Drop a file or click to choose</p>
                          <p className="mt-1 text-xs text-text-muted">PDF, TXT, MD, CSV, JSON, and code files (max 15MB)</p>
                        </div>
                      )}
                    </div>
                    <input id="file-input" type="file" className="hidden"
                      accept=".pdf,.txt,.md,.markdown,.csv,.json,.js,.ts,.tsx,.jsx,.py,.java,.c,.cpp,.h,.go,.rs,.rb,.php,.html,.css,.yml,.yaml,.xml,.sql"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />

                    {uploading && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-text-muted mb-1">
                          <span>Indexing…</span><span>{uploadProgress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-bg-hover rounded-full overflow-hidden">
                          <div className="h-full bg-accent rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                        </div>
                      </div>
                    )}

                    <button
                      onClick={upload}
                      disabled={!file || !uploadCollectionId || uploading}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {uploading ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Indexing…</>
                      ) : (
                        <><Plus className="h-4 w-4" /> Upload and index</>
                      )}
                    </button>
                  </>
                )}
              </div>

              {/* Supported formats */}
              <div className="glass rounded-xl p-4">
                <p className="text-xs font-semibold text-text-muted mb-3">SUPPORTED FORMATS</p>
                <div className="grid grid-cols-2 gap-1.5 text-xs text-text-secondary">
                  {['PDF', 'TXT', 'Markdown', 'CSV', 'JSON', 'JavaScript', 'TypeScript', 'Python', 'Go', 'Rust', 'Java', 'C/C++'].map(f => (
                    <div key={f} className="flex items-center gap-1.5">
                      <div className="h-1 w-1 rounded-full bg-success" />{f}
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick links */}
              <div className="glass rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-text-muted mb-2">QUICK ACTIONS</p>
                <Link href="/collections" className="flex items-center gap-2 text-xs text-text-secondary hover:text-accent transition-colors py-1">
                  <FolderPlus className="h-3.5 w-3.5" /> Manage collections
                </Link>
                <Link href="/chat" className="flex items-center gap-2 text-xs text-text-secondary hover:text-accent transition-colors py-1">
                  <MessageSquare className="h-3.5 w-3.5" /> Chat with documents
                </Link>
                <Link href="/search" className="flex items-center gap-2 text-xs text-text-secondary hover:text-accent transition-colors py-1">
                  <Search className="h-3.5 w-3.5" /> Search passages
                </Link>
              </div>
            </div>

            {/* Documents table */}
            <div className="glass overflow-hidden rounded-xl">
              <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold">Indexed documents</h2>
                  <p className="text-xs text-text-muted">Auto-refreshes every 8s · {filteredDocuments.length} shown</p>
                </div>
                <div className="flex items-center gap-2">
                  {statusFilter !== 'all' && (
                    <button onClick={() => setStatusFilter('all')} className="inline-flex items-center gap-1 rounded-lg border border-accent/30 bg-accent/10 px-2 py-1 text-xs text-accent hover:bg-accent/20 transition-colors">
                      <Filter className="h-3 w-3" /> {statusFilter} <X className="h-3 w-3" />
                    </button>
                  )}
                  <div className="relative w-full sm:w-64">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Filter filenames…"
                      className="w-full rounded-lg border border-border bg-bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-accent/50"
                    />
                  </div>
                </div>
              </div>

              {loadingDocs ? (
                <div className="flex items-center justify-center gap-2 p-10 text-sm text-text-muted">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading documents…
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="p-10 text-center">
                  <FileText className="mx-auto h-10 w-10 text-text-muted opacity-40" />
                  <h3 className="mt-3 font-semibold">No documents found</h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-text-muted">
                    {query || statusFilter !== 'all' ? 'Try clearing your filters.' : 'Upload your first document to get started.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="bg-bg-secondary/60 text-xs uppercase tracking-wide text-text-muted">
                      <tr>
                        <th className="px-4 py-3 font-medium">
                          <button onClick={() => toggleSort('name')} className="flex items-center gap-1 hover:text-text-primary transition-colors">
                            Document <SortIcon field="name" />
                          </button>
                        </th>
                        <th className="px-4 py-3 font-medium">Collection</th>
                        <th className="px-4 py-3 font-medium">Chunks</th>
                        <th className="px-4 py-3 font-medium">
                          <button onClick={() => toggleSort('size')} className="flex items-center gap-1 hover:text-text-primary transition-colors">
                            Size <SortIcon field="size" />
                          </button>
                        </th>
                        <th className="px-4 py-3 font-medium">
                          <button onClick={() => toggleSort('status')} className="flex items-center gap-1 hover:text-text-primary transition-colors">
                            Status <SortIcon field="status" />
                          </button>
                        </th>
                        <th className="px-4 py-3 font-medium">
                          <button onClick={() => toggleSort('createdAt')} className="flex items-center gap-1 hover:text-text-primary transition-colors">
                            Added <SortIcon field="createdAt" />
                          </button>
                        </th>
                        <th className="px-4 py-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDocuments.map((doc) => (
                        <tr key={doc.id} className="border-t border-border/70 hover:bg-bg-secondary/30 transition-colors">
                          <td className="max-w-[220px] px-4 py-3">
                            <div className="flex items-center gap-2">
                              <FileTypeIcon type={doc.type} name={doc.name} />
                              <div>
                                <div className="truncate font-medium">{doc.name}</div>
                                {doc.error && <div className="mt-0.5 truncate text-xs text-danger" title={doc.error}>{doc.error.slice(0, 60)}…</div>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-text-secondary text-xs">{collectionName(collections, doc.collectionId)}</td>
                          <td className="px-4 py-3 text-text-secondary font-mono text-xs">{doc.chunkCount}</td>
                          <td className="px-4 py-3 text-text-secondary text-xs">{formatBytes(doc.size)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusClass(doc.status)}`}>
                              {doc.status === 'processing' && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
                              {doc.status === 'ready' && <div className="h-1.5 w-1.5 rounded-full bg-success" />}
                              {doc.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-text-muted text-xs">{relativeTime(doc.createdAt)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setViewDoc(doc)}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-accent/10 hover:text-accent"
                                title="View details"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              <Link
                                href={`/chat?collectionId=${doc.collectionId}`}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-accent/10 hover:text-accent"
                                title="Chat about this"
                              >
                                <MessageSquare className="h-3.5 w-3.5" />
                              </Link>
                              <button
                                onClick={() => removeDocument(doc.id)}
                                disabled={deleting === doc.id}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-40"
                                title={`Delete ${doc.name}`}
                              >
                                {deleting === doc.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          <div className="rounded-xl border border-border bg-bg-secondary/35 px-4 py-3 text-sm text-text-secondary">
            Ready to ask questions?{' '}
            <Link href="/chat" className="text-accent hover:underline">Open Chat</Link>
            {' '}and scope answers to any collection.
          </div>
        </div>
      </div>
    </AuthGate>
  );
}
