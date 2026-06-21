'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  FolderPlus,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import CollectionPicker from '@/components/app/CollectionPicker';
import AuthGate from '@/components/app/AuthGate';
import { useCollections } from '@/lib/use-collections';
import { Collection, DocumentMeta } from '@/lib/types';
import { formatBytes, relativeTime } from '@/lib/utils';

type Notice = { type: 'success' | 'error'; text: string } | null;

function statusClass(status: DocumentMeta['status']) {
  if (status === 'ready') return 'text-success bg-success/10 border-success/20';
  if (status === 'processing') return 'text-accent-2 bg-accent-2/10 border-accent-2/20';
  return 'text-danger bg-danger/10 border-danger/20';
}

function collectionName(collections: Collection[], id: string) {
  return collections.find((c) => c.id === id)?.name || 'Unknown collection';
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
  const [notice, setNotice] = useState<Notice>(null);

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

  const filteredDocuments = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return documents;
    return documents.filter((doc) => doc.name.toLowerCase().includes(needle));
  }, [documents, query]);

  const stats = useMemo(() => {
    const ready = documents.filter((doc) => doc.status === 'ready').length;
    const chunks = documents.reduce((sum, doc) => sum + doc.chunkCount, 0);
    const bytes = documents.reduce((sum, doc) => sum + doc.size, 0);
    return { ready, chunks, bytes };
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
    setNotice(null);
    const form = new FormData();
    form.append('file', file);
    form.append('collectionId', uploadCollectionId);

    try {
      const res = await fetch('/api/ingest', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setNotice({
        type: data.document?.status === 'ready' ? 'success' : 'error',
        text:
          data.document?.status === 'ready'
            ? `${data.document.name} indexed with ${data.document.chunkCount} chunks.`
            : data.document?.error || 'No extractable text was found.',
      });
      setFile(null);
      await refreshDocuments();
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Upload failed.' });
    } finally {
      setUploading(false);
    }
  };

  const removeDocument = async (id: string) => {
    const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setNotice({ type: 'success', text: 'Document removed.' });
      await refreshDocuments();
    } else {
      setNotice({ type: 'error', text: 'Document could not be removed.' });
    }
  };

  return (
    <AuthGate>
      <div className="min-h-[calc(100vh-4rem)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-mono font-bold tracking-widest text-text-muted">DOCUMENT VAULT</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Upload, index, and manage knowledge</h1>
            <p className="mt-2 max-w-2xl text-sm text-text-secondary">
              Add PDFs, notes, datasets, markdown, and code files. DocuMind chunks and embeds them for cited chat.
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

        <section className="grid gap-3 sm:grid-cols-3">
          <div className="glass rounded-xl p-4">
            <p className="text-xs text-text-muted">Ready documents</p>
            <p className="mt-2 text-2xl font-semibold">{stats.ready}</p>
          </div>
          <div className="glass rounded-xl p-4">
            <p className="text-xs text-text-muted">Indexed chunks</p>
            <p className="mt-2 text-2xl font-semibold">{stats.chunks}</p>
          </div>
          <div className="glass rounded-xl p-4">
            <p className="text-xs text-text-muted">Stored text files</p>
            <p className="mt-2 text-2xl font-semibold">{formatBytes(stats.bytes)}</p>
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
          <div className="space-y-4">
            <div className="glass rounded-xl p-5">
              <div className="mb-4 flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-accent" />
                <h2 className="font-semibold">Ingest a document</h2>
              </div>

              {collections.length === 0 && !loadingCollections ? (
                <div className="rounded-lg border border-border bg-bg-secondary/50 p-4">
                  <p className="text-sm text-text-secondary">Create a collection before uploading your first document.</p>
                  <div className="mt-3 flex gap-2">
                    <input
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      placeholder="Research, Legal, Product..."
                      className="min-w-0 flex-1 rounded-lg border border-border bg-bg-card px-3 py-2 text-sm outline-none focus:border-accent/50"
                    />
                    <button
                      onClick={createQuickCollection}
                      disabled={!newCollectionName.trim()}
                      className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
                    >
                      <FolderPlus className="h-4 w-4" />
                      Create
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <label className="mb-2 block text-xs font-medium text-text-muted">Collection</label>
                  <CollectionPicker collections={collections} value={uploadCollectionId} onChange={setUploadCollectionId} />

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragging(false);
                      setFile(e.dataTransfer.files?.[0] || null);
                    }}
                    className={`mt-4 rounded-xl border border-dashed p-6 text-center transition-colors ${
                      dragging ? 'border-accent bg-accent-soft' : 'border-border bg-bg-secondary/50'
                    }`}
                  >
                    <UploadCloud className="mx-auto h-9 w-9 text-accent" />
                    <p className="mt-3 text-sm font-medium">Drop a file here or choose one</p>
                    <p className="mt-1 text-xs text-text-muted">PDF, TXT, MD, CSV, JSON, and code-like text files.</p>
                    <input
                      type="file"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="mt-4 w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
                    />
                    {file && <p className="mt-3 text-xs text-text-secondary">{file.name} - {formatBytes(file.size)}</p>}
                  </div>

                  <button
                    onClick={upload}
                    disabled={!file || !uploadCollectionId || uploading}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                    {uploading ? 'Indexing document...' : 'Upload and index'}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="glass overflow-hidden rounded-xl">
            <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold">Indexed documents</h2>
                <p className="text-xs text-text-muted">Live refreshes every few seconds while this page is open.</p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search filenames"
                  className="w-full rounded-lg border border-border bg-bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-accent/50"
                />
              </div>
            </div>

            {loadingDocs ? (
              <div className="flex items-center justify-center gap-2 p-10 text-sm text-text-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading documents
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="p-10 text-center">
                <FileText className="mx-auto h-10 w-10 text-text-muted" />
                <h3 className="mt-3 font-semibold">No documents found</h3>
                <p className="mx-auto mt-2 max-w-sm text-sm text-text-muted">
                  Upload your first file or adjust the active collection and filename filters.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-bg-secondary/60 text-xs uppercase tracking-wide text-text-muted">
                    <tr>
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
                    {filteredDocuments.map((doc) => (
                      <tr key={doc.id} className="border-t border-border/70">
                        <td className="max-w-[260px] px-4 py-3">
                          <div className="truncate font-medium">{doc.name}</div>
                          {doc.error && <div className="mt-1 truncate text-xs text-danger">{doc.error}</div>}
                        </td>
                        <td className="px-4 py-3 text-text-secondary">{collectionName(collections, doc.collectionId)}</td>
                        <td className="px-4 py-3 text-text-secondary">{doc.chunkCount}</td>
                        <td className="px-4 py-3 text-text-secondary">{formatBytes(doc.size)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full border px-2 py-1 text-xs ${statusClass(doc.status)}`}>
                            {doc.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-text-muted">{relativeTime(doc.createdAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => removeDocument(doc.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                            aria-label={`Delete ${doc.name}`}
                          >
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

        <div className="rounded-xl border border-border bg-bg-secondary/35 px-4 py-3 text-sm text-text-secondary">
          Ready to ask questions? Open <Link href="/chat" className="text-accent hover:underline">Chat</Link> and scope answers to any collection.
        </div>
      </div>
      </div>
    </AuthGate>
  );
}
