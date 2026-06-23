'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle, CheckCircle2, FileText, FolderPlus,
  Loader2, RefreshCw, Search, Trash2, UploadCloud,
  Download, XCircle, BarChart3, Layers, Database,
} from 'lucide-react';
import CollectionPicker from '@/components/app/CollectionPicker';
import AuthGate from '@/components/app/AuthGate';
import { useCollections } from '@/lib/use-collections';
import { Collection, DocumentMeta } from '@/lib/types';
import { formatBytes, relativeTime } from '@/lib/utils';

type Notice = { type: 'success' | 'error'; text: string } | null;

interface UploadJob { file: File; state: 'pending' | 'uploading' | 'done' | 'error'; message?: string; }

function statusClass(status: DocumentMeta['status']) {
  if (status === 'ready')      return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  if (status === 'processing') return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  return 'text-red-400 bg-red-500/10 border-red-500/20';
}
function colName(collections: Collection[], id: string) {
  return collections.find((c) => c.id === id)?.name || 'Unknown';
}

export default function DocumentsPage() {
  const { collections, loading: loadingCols, create: createCollection } = useCollections();
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [collectionId, setCollectionId] = useState('');
  const [uploadColId, setUploadColId] = useState('');
  const [newColName, setNewColName] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const [query, setQuery] = useState('');
  const [dragging, setDragging] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [exportingCSV, setExportingCSV] = useState(false);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('collectionId');
    if (id) { setCollectionId(id); setUploadColId(id); }
  }, []);

  const refreshDocuments = useCallback(async () => {
    setLoadingDocs(true);
    try {
      const q = collectionId ? `?collectionId=${encodeURIComponent(collectionId)}` : '';
      const data = await fetch(`/api/documents${q}`).then((r) => r.json());
      setDocuments(data.documents || []);
    } catch { setNotice({ type: 'error', text: 'Unable to load documents.' }); setDocuments([]); }
    finally { setLoadingDocs(false); }
  }, [collectionId]);

  useEffect(() => { refreshDocuments(); const t = setInterval(refreshDocuments, 8000); return () => clearInterval(t); }, [refreshDocuments]);
  useEffect(() => { if (!uploadColId && collections.length) setUploadColId(collections[0].id); }, [collections, uploadColId]);

  const filtered = useMemo(() => {
    const n = query.trim().toLowerCase();
    return n ? documents.filter((d) => d.name.toLowerCase().includes(n)) : documents;
  }, [documents, query]);

  const stats = useMemo(() => ({
    ready:  documents.filter((d) => d.status === 'ready').length,
    chunks: documents.reduce((s, d) => s + d.chunkCount, 0),
    bytes:  documents.reduce((s, d) => s + d.size, 0),
  }), [documents]);

  const addFiles = (incoming: File[]) => {
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name));
      return [...prev, ...incoming.filter((f) => !existing.has(f.name))];
    });
  };

  const removeFile = (name: string) => setFiles((prev) => prev.filter((f) => f.name !== name));

  const upload = async () => {
    if (!files.length || !uploadColId || uploading) return;
    setUploading(true);
    setJobs(files.map((file) => ({ file, state: 'pending' })));
    let anyError = false;

    for (let i = 0; i < files.length; i++) {
      setJobs((prev) => prev.map((j, idx) => idx === i ? { ...j, state: 'uploading' } : j));
      try {
        const form = new FormData();
        form.append('file', files[i]);
        form.append('collectionId', uploadColId);
        const res = await fetch('/api/ingest', { method: 'POST', body: form });
        const data = await res.json();
        if (!res.ok || data.document?.status === 'error') {
          setJobs((prev) => prev.map((j, idx) => idx === i ? { ...j, state: 'error', message: data.document?.error || data.error || 'Failed' } : j));
          anyError = true;
        } else {
          setJobs((prev) => prev.map((j, idx) => idx === i ? { ...j, state: 'done', message: `${data.document.chunkCount} chunks` } : j));
        }
      } catch (err) {
        setJobs((prev) => prev.map((j, idx) => idx === i ? { ...j, state: 'error', message: err instanceof Error ? err.message : 'Upload failed' } : j));
        anyError = true;
      }
    }

    await refreshDocuments();
    setNotice({ type: anyError ? 'error' : 'success', text: anyError ? 'Some files failed — see upload log.' : `${files.length} file(s) indexed.` });
    setFiles([]);
    setUploading(false);
  };

  const removeDoc = async (id: string) => {
    await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
    await refreshDocuments();
  };

  const bulkDelete = async () => {
    if (!selected.size) return;
    setBulkDeleting(true);
    await Promise.all([...selected].map((id) => fetch(`/api/documents/${id}`, { method: 'DELETE' })));
    setSelected(new Set());
    setNotice({ type: 'success', text: `${selected.size} document(s) removed.` });
    await refreshDocuments();
    setBulkDeleting(false);
  };

  const toggleSelect = (id: string) => setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map((d) => d.id)));

  const exportCSV = async () => {
    setExportingCSV(true);
    try {
      const res = await fetch('/api/export/documents');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `documents-${Date.now()}.csv`; a.click();
      URL.revokeObjectURL(url);
    } finally { setExportingCSV(false); }
  };

  return (
    <AuthGate>
      <div className="min-h-[calc(100vh-4rem)] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">

          <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-mono font-bold tracking-widest text-text-muted">DOCUMENT VAULT</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">Documents</h1>
              <p className="mt-2 text-sm text-text-secondary max-w-2xl">
                Upload, index, and manage your knowledge base. Multi-file upload supported.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <CollectionPicker collections={collections} value={collectionId} onChange={setCollectionId} includeAll />
              <button onClick={exportCSV} disabled={exportingCSV || !documents.length}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-bg-card px-3 text-sm text-text-secondary hover:text-text-primary transition-colors disabled:opacity-40">
                {exportingCSV ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Export CSV
              </button>
              <button onClick={refreshDocuments}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-bg-card px-3 text-sm text-text-secondary hover:text-text-primary transition-colors">
                <RefreshCw className={`h-4 w-4 ${loadingDocs ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </header>

          {/* Stats */}
          <section className="grid gap-3 sm:grid-cols-4">
            {[
              { icon: FileText,  label: 'Total documents', value: documents.length,    sub: `${stats.ready} ready` },
              { icon: CheckCircle2, label: 'Ready for chat', value: stats.ready,       sub: 'indexed & searchable' },
              { icon: Layers,    label: 'Chunks indexed',   value: stats.chunks,       sub: 'searchable passages' },
              { icon: Database,  label: 'Storage used',     value: formatBytes(stats.bytes), sub: 'raw file size' },
            ].map(({ icon: Icon, label, value, sub }) => (
              <div key={label} className="glass rounded-xl p-4">
                <Icon className="w-4 h-4 text-accent mb-2" />
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-text-muted">{label}</p>
                <p className="text-[10px] text-text-muted mt-0.5">{sub}</p>
              </div>
            ))}
          </section>

          {notice && (
            <div className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
              notice.type === 'success' ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400'
                                       : 'border-red-500/25 bg-red-500/10 text-red-400'}`}>
              {notice.type === 'success' ? <CheckCircle2 className="h-4 w-4 mt-0.5" /> : <AlertCircle className="h-4 w-4 mt-0.5" />}
              <span>{notice.text}</span>
            </div>
          )}

          <section className="grid gap-6 xl:grid-cols-[minmax(320px,420px)_1fr]">
            {/* Upload panel */}
            <div className="space-y-4">
              <div className="glass rounded-xl p-5">
                <div className="mb-4 flex items-center gap-2">
                  <UploadCloud className="h-5 w-5 text-accent" />
                  <h2 className="font-semibold">Ingest documents</h2>
                  <span className="text-[10px] text-text-muted ml-auto">multi-file</span>
                </div>

                {collections.length === 0 && !loadingCols ? (
                  <div className="rounded-lg border border-border bg-bg-secondary/50 p-4">
                    <p className="text-sm text-text-secondary">Create a collection first.</p>
                    <div className="mt-3 flex gap-2">
                      <input value={newColName} onChange={(e) => setNewColName(e.target.value)}
                        placeholder="Research, Legal, Product…"
                        className="min-w-0 flex-1 rounded-lg border border-border bg-bg-card px-3 py-2 text-sm outline-none focus:border-accent/50" />
                      <button onClick={async () => { const ok = await createCollection(newColName.trim()); if (ok) setNewColName(''); }}
                        disabled={!newColName.trim()}
                        className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">
                        <FolderPlus className="h-4 w-4" /> Create
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <label className="mb-1.5 block text-xs font-medium text-text-muted">Collection</label>
                    <CollectionPicker collections={collections} value={uploadColId} onChange={setUploadColId} />

                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(Array.from(e.dataTransfer.files)); }}
                      className={`mt-4 rounded-xl border border-dashed p-6 text-center transition-colors cursor-pointer ${
                        dragging ? 'border-accent bg-accent-soft' : 'border-border bg-bg-secondary/50 hover:border-accent/30'}`}>
                      <UploadCloud className="mx-auto h-8 w-8 text-accent" />
                      <p className="mt-2 text-sm font-medium">Drop files here or choose files</p>
                      <p className="mt-1 text-xs text-text-muted">PDF, TXT, MD, CSV, JSON, code files</p>
                      <input type="file" multiple
                        onChange={(e) => { if (e.target.files) addFiles(Array.from(e.target.files)); }}
                        className="mt-4 w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-xs file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white" />
                    </div>

                    {files.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        {files.map((f) => (
                          <div key={f.name} className="flex items-center gap-2 rounded-lg bg-bg-secondary/60 border border-border px-3 py-2">
                            <FileText className="w-3.5 h-3.5 text-text-muted shrink-0" />
                            <span className="text-xs flex-1 truncate">{f.name}</span>
                            <span className="text-[10px] text-text-muted shrink-0">{formatBytes(f.size)}</span>
                            <button onClick={() => removeFile(f.name)} className="text-text-muted hover:text-red-400 transition-colors">
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <button onClick={upload} disabled={!files.length || !uploadColId || uploading}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity">
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                      {uploading ? 'Indexing…' : `Upload ${files.length > 1 ? `${files.length} files` : 'file'}`}
                    </button>

                    {jobs.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {jobs.map((j) => (
                          <div key={j.file.name} className="flex items-center gap-2 text-xs px-2">
                            {j.state === 'done'      && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                            {j.state === 'error'     && <AlertCircle  className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                            {j.state === 'uploading' && <Loader2      className="w-3.5 h-3.5 animate-spin text-accent shrink-0" />}
                            {j.state === 'pending'   && <div className="w-3.5 h-3.5 rounded-full border border-border shrink-0" />}
                            <span className="truncate flex-1 text-text-secondary">{j.file.name}</span>
                            {j.message && <span className={`shrink-0 ${j.state === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>{j.message}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              <Link href="/analytics"
                className="glass rounded-xl p-4 flex items-center gap-3 hover:border-accent/30 transition-colors cursor-pointer">
                <BarChart3 className="w-5 h-5 text-blue-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium">View Analytics</p>
                  <p className="text-xs text-text-muted">Charts · collection stats · storage mode</p>
                </div>
              </Link>
            </div>

            {/* Documents table */}
            <div className="glass overflow-hidden rounded-xl">
              <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold">Indexed documents</h2>
                  <p className="text-xs text-text-muted">Auto-refreshes every 8s · {filtered.length} shown</p>
                </div>
                <div className="flex items-center gap-2">
                  {selected.size > 0 && (
                    <button onClick={bulkDelete} disabled={bulkDeleting}
                      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50">
                      {bulkDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      Delete {selected.size}
                    </button>
                  )}
                  <div className="relative w-full sm:w-64">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search filenames…"
                      className="w-full rounded-lg border border-border bg-bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-accent/50" />
                  </div>
                </div>
              </div>

              {loadingDocs ? (
                <div className="flex items-center justify-center gap-2 p-10 text-sm text-text-muted">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading documents
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-10 text-center">
                  <FileText className="mx-auto h-10 w-10 text-text-muted" />
                  <h3 className="mt-3 font-semibold">No documents found</h3>
                  <p className="mt-2 text-sm text-text-muted max-w-sm mx-auto">Upload your first file or adjust filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] text-left text-sm">
                    <thead className="bg-bg-secondary/60 text-xs uppercase tracking-wide text-text-muted">
                      <tr>
                        <th className="px-4 py-3 w-8">
                          <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0}
                            onChange={toggleAll} className="rounded border-border" />
                        </th>
                        <th className="px-4 py-3 font-medium">Document</th>
                        <th className="px-4 py-3 font-medium">Collection</th>
                        <th className="px-4 py-3 font-medium">Chunks</th>
                        <th className="px-4 py-3 font-medium">Size</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Added</th>
                        <th className="px-4 py-3 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((doc) => (
                        <tr key={doc.id} className={`border-t border-border/70 hover:bg-white/[0.015] transition-colors ${selected.has(doc.id) ? 'bg-accent/5' : ''}`}>
                          <td className="px-4 py-3">
                            <input type="checkbox" checked={selected.has(doc.id)} onChange={() => toggleSelect(doc.id)} className="rounded border-border" />
                          </td>
                          <td className="max-w-[220px] px-4 py-3">
                            <div className="truncate font-medium">{doc.name}</div>
                            {doc.error && <div className="mt-0.5 truncate text-xs text-red-400">{doc.error}</div>}
                          </td>
                          <td className="px-4 py-3 text-text-secondary text-xs">{colName(collections, doc.collectionId)}</td>
                          <td className="px-4 py-3 text-text-secondary font-mono text-xs">{doc.chunkCount}</td>
                          <td className="px-4 py-3 text-text-secondary text-xs">{formatBytes(doc.size)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass(doc.status)}`}>
                              {doc.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-text-muted text-xs">{relativeTime(doc.createdAt)}</td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => removeDoc(doc.id)} aria-label={`Delete ${doc.name}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-red-500/10 hover:text-red-400 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          <div className="rounded-xl border border-border bg-bg-secondary/30 px-4 py-3 text-sm text-text-secondary">
            Ready to ask questions?{' '}
            <Link href="/chat" className="text-accent hover:underline">Open Chat</Link>{' '}
            and scope answers to any collection.
          </div>
        </div>
      </div>
    </AuthGate>
  );
}
