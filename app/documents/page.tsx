'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle, AlertTriangle, Bot, CheckCircle2, ChevronDown, ChevronUp,
  Copy, Database, Eye, File, FileCode, FileText, Filter,
  FolderOpen, Hash, Layers, Loader2, MessageSquare, Plus,
  RefreshCw, Search, Trash2, UploadCloud, X, Zap, Sparkles,
  Files, ArrowRight, Info, Upload,
} from 'lucide-react';
import AuthGate from '@/components/app/AuthGate';
import { useCollections } from '@/lib/use-collections';
import { useToast } from '@/components/shared/Toast';
import { Collection, DocumentMeta } from '@/lib/types';
import { formatBytes, relativeTime } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
type SortField = 'name' | 'size' | 'createdAt' | 'status';
type SortDir   = 'asc' | 'desc';
type DbHealth  = { ok: boolean; mode: string; pgvector: boolean; message: string; error?: string } | null;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function statusClass(s: DocumentMeta['status']) {
  if (s === 'ready')      return 'text-success bg-success/10 border-success/20';
  if (s === 'processing') return 'text-accent  bg-accent/10  border-accent/20';
  return 'text-danger bg-danger/10 border-danger/20';
}

const MAX_FILE_BYTES = 15 * 1024 * 1024;
const ACCEPTED_EXTS = [
  '.pdf','.txt','.md','.markdown','.csv','.json','.tsv','.log',
  '.js','.ts','.tsx','.jsx','.py','.java','.c','.cpp','.h',
  '.go','.rs','.rb','.php','.html','.css','.yml','.yaml','.xml','.sql',
];

function validateFile(f: File): string | null {
  if (f.size > MAX_FILE_BYTES) return `${f.name} is too large (max 15 MB).`;
  const ext = f.name.includes('.') ? `.${f.name.split('.').pop()!.toLowerCase()}` : '';
  if (ext && !ACCEPTED_EXTS.includes(ext)) return `${f.name}: unsupported format. Use PDF, MD, TXT, CSV, JSON, or code files.`;
  return null;
}

function FileTypeIcon({ name }: { name: string }) {
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (ext === 'pdf') return <span className="text-red-400 font-bold text-[9px] bg-red-400/10 rounded px-1 py-0.5">PDF</span>;
  if (['md','txt'].includes(ext)) return <File className="h-3.5 w-3.5 text-blue-400" />;
  if (['csv','json'].includes(ext)) return <Database className="h-3.5 w-3.5 text-green-400" />;
  if (['js','ts','tsx','jsx','py','rs','go','java','c','cpp','sql'].includes(ext)) return <FileCode className="h-3.5 w-3.5 text-purple-400" />;
  return <Hash className="h-3.5 w-3.5 text-text-muted" />;
}

// ─── Create Collection Modal ──────────────────────────────────────────────────
function CreateCollectionModal({
  onCreated, onClose,
}: {
  onCreated: (c: Collection) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState('');
  const { success, error: toastError } = useToast();

  const submit = async () => {
    if (!name.trim()) { setErr('Collection name is required.'); return; }
    setBusy(true); setErr('');
    try {
      const r = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: desc.trim() || undefined }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed to create collection');
      success('Collection created!', `"${d.collection.name}" is ready. Files you upload will go here.`);
      onCreated(d.collection);
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not create collection';
      setErr(msg);
      toastError('Collection creation failed', msg);
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 border border-accent/20">
            <FolderOpen className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h2 className="font-bold text-sm">New Collection</h2>
            <p className="text-[11px] text-text-muted">Group documents into a searchable workspace</p>
          </div>
          <button onClick={onClose} className="ml-auto p-1 rounded-lg text-text-muted hover:text-text-primary transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-text-secondary">Name <span className="text-danger">*</span></label>
            <input
              value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="e.g. Research Papers, Product Docs…"
              autoFocus
              className="mt-1 w-full rounded-xl border border-border bg-bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-accent/50 transition-colors placeholder:text-text-muted"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary">Description <span className="text-text-muted">(optional)</span></label>
            <input
              value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="What documents will you store here?"
              className="mt-1 w-full rounded-xl border border-border bg-bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-accent/50 transition-colors placeholder:text-text-muted"
            />
          </div>
          {err && <p className="text-xs text-danger bg-danger/5 border border-danger/20 rounded-lg px-3 py-2">{err}</p>}
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl border border-border px-4 py-2 text-xs font-medium text-text-secondary hover:bg-bg-hover transition-colors">Cancel</button>
          <button
            onClick={submit} disabled={busy || !name.trim()}
            className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Create Collection
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DB Health Banner ─────────────────────────────────────────────────────────
function DbHealthBanner({ health }: { health: DbHealth }) {
  const [copied, setCopied] = useState(false);
  if (!health || health.ok) return null;
  const copy = () => {
    navigator.clipboard.writeText(health.error || health.message);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/8 px-4 py-3">
      <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-warning">Database setup issue</p>
        <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{health.message}</p>
        {health.error && <p className="mt-1 text-[11px] font-mono text-text-muted truncate">{health.error}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {health.error && (
          <button onClick={copy} className="flex items-center gap-1 text-[11px] text-warning hover:opacity-70 transition-opacity">
            {copied ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />} {copied ? 'Copied' : 'Copy'}
          </button>
        )}
        <a
          href="https://github.com/ShaikMuzzammil/documind#database-setup"
          target="_blank" rel="noopener noreferrer"
          className="text-[11px] text-warning underline hover:opacity-70 transition-opacity"
        >Setup guide ↗</a>
      </div>
    </div>
  );
}

// ─── Preview Modal ────────────────────────────────────────────────────────────
function PreviewModal({ doc, onClose }: { doc: DocumentMeta; onClose: () => void }) {
  const [loading, setLoading]    = useState(true);
  const [data, setData]          = useState<{ chunkCount: number; chunks: { index: number; text: string }[] } | null>(null);
  const [activeChunk, setActive] = useState(0);
  const [error, setError]        = useState('');

  useEffect(() => {
    fetch(`/api/documents/${doc.id}/preview`).then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d); })
      .catch(() => setError('Could not load preview')).finally(() => setLoading(false));
  }, [doc.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 border border-accent/20">
            <FileText className="h-4 w-4 text-accent" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-sm truncate">{doc.name}</h2>
            <p className="text-[11px] text-text-muted">{formatBytes(doc.size)} · {doc.chunkCount} chunks indexed</p>
          </div>
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
        <div className="flex-1 overflow-hidden flex">
          {loading ? (
            <div className="flex flex-1 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
          ) : error ? (
            <div className="flex flex-1 items-center justify-center text-center p-8">
              <div><AlertCircle className="h-8 w-8 text-danger mx-auto mb-2 opacity-60" /><p className="text-sm text-danger">{error}</p></div>
            </div>
          ) : data && data.chunks.length > 0 ? (
            <>
              <div className="w-44 shrink-0 border-r border-border bg-bg-secondary/30 overflow-y-auto">
                <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted border-b border-border">{data.chunkCount} chunks</p>
                {data.chunks.map((c, i) => (
                  <button key={i} onClick={() => setActive(i)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-[11px] transition-colors ${activeChunk === i ? 'bg-accent/10 text-accent' : 'text-text-secondary hover:bg-bg-hover'}`}>
                    <span className="shrink-0 font-mono">{String(c.index + 1).padStart(2, '0')}</span>
                    <span className="truncate">{c.text.slice(0, 28)}…</span>
                  </button>
                ))}
                {data.chunkCount > data.chunks.length && (
                  <p className="px-3 py-2 text-[10px] text-text-muted">+{data.chunkCount - data.chunks.length} more…</p>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Chunk {data.chunks[activeChunk].index + 1}</span>
                  <div className="flex gap-1">
                    <button disabled={activeChunk === 0} onClick={() => setActive(i => i - 1)} className="p-1 rounded text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors"><ChevronUp className="h-3.5 w-3.5" /></button>
                    <button disabled={activeChunk === data.chunks.length - 1} onClick={() => setActive(i => i + 1)} className="p-1 rounded text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors"><ChevronDown className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <pre className="text-xs leading-relaxed text-text-primary whitespace-pre-wrap font-mono bg-bg-secondary/30 rounded-xl p-4 border border-border">{data.chunks[activeChunk].text}</pre>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center"><p className="text-sm text-text-muted">No chunks available</p></div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Upload Bot ───────────────────────────────────────────────────────────────
type BotMsg = { role: 'bot' | 'user'; text: string };

const BOT_RESPONSES: { pattern: RegExp; text: string }[] = [
  { pattern: /pgvector|extension|vector does not/i,                        text: 'Enable pgvector in your Neon dashboard → Databases → Extensions → search "vector" → Enable. Then re-upload.' },
  { pattern: /ocr|scanned|no text layer/i,                                 text: 'This PDF has no text layer — it may be a scanned image. Run OCR first (Adobe Acrobat, Smallpdf, or ILovePDF) then re-upload.' },
  { pattern: /COLLECTION_NOT_FOUND|collection.*not.*exist|no longer exist/i, text: 'The collection reference failed. Create a new collection using the "New Collection" button, select it, then upload.' },
  { pattern: /dimension|embed_dim/i,                                        text: 'Embedding dimension mismatch. Drop and recreate the chunks table in Neon SQL Editor, then retry.' },
  { pattern: /multi|multiple|batch|many files/i,                            text: 'Yes! Click the upload zone and select multiple files at once, or drag a batch of files. Each uploads sequentially with its own progress indicator.' },
  { pattern: /pdf|format/i,                                                 text: 'DocuMind extracts text from PDFs using pdfjs-dist. Encrypted, password-protected, or scanned (image-only) PDFs are not supported without OCR.' },
  { pattern: /chunk|how many|count/i,                                       text: 'I can look up your chunk count — just ask "how many chunks?" and I\'ll tally them from your indexed documents.' },
  { pattern: /size|large|too big|15|mb/i,                                   text: 'Maximum file size is 15 MB per file. Split larger files before uploading. DocuMind validates this before upload starts.' },
  { pattern: /retry|try again|failed/i,                                     text: 'Delete the failed document from the list on the right, then re-upload. Check the error details by clicking the alert icon on the row.' },
  { pattern: /collection|folder|group/i,                                    text: 'Collections keep files organized. Create one with "New Collection", select it in the dropdown above the upload zone, then upload.' },
];

function getBotTip(errorMsg?: string): string {
  if (!errorMsg) return '';
  for (const { pattern, text } of BOT_RESPONSES) {
    if (pattern.test(errorMsg)) return text;
  }
  return `Upload error: ${errorMsg.slice(0, 140)}. Check the error row on the right for the full message.`;
}

function UploadBot({ docs, dbHealth }: { docs: DocumentMeta[]; dbHealth: DbHealth }) {
  const [msgs, setMsgs]   = useState<BotMsg[]>([{ role: 'bot', text: 'Hi! Drop files and I\'ll troubleshoot any issues in real time. Ask about "PDF errors", "multi-file", "collection errors", or "retry".' }]);
  const [input, setInput] = useState('');
  const [open, setOpen]   = useState(true);
  const bottomRef         = useRef<HTMLDivElement>(null);
  const seenErrors        = useRef(new Set<string>());

  useEffect(() => {
    const errorDocs = docs.filter(d => d.status === 'error' && d.error);
    for (const d of errorDocs) {
      const key = `${d.id}-${d.error}`;
      if (!seenErrors.current.has(key)) {
        seenErrors.current.add(key);
        const tip = getBotTip(d.error);
        if (tip) setMsgs(prev => [...prev, { role: 'bot', text: `⚠️ "${d.name.slice(0, 30)}": ${tip}` }]);
      }
    }
  }, [docs]);

  useEffect(() => {
    if (dbHealth && !dbHealth.ok) {
      const tip = !dbHealth.pgvector
        ? 'Enable pgvector in your Neon dashboard → Extensions → search "vector" → Enable. Then retry uploads.'
        : dbHealth.message;
      setMsgs(prev => {
        if (prev.some(m => m.text === tip)) return prev;
        return [...prev, { role: 'bot', text: tip }];
      });
    }
  }, [dbHealth]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const send = (q: string = input.trim()) => {
    if (!q) return;
    setInput('');
    setMsgs(prev => [...prev, { role: 'user', text: q }]);
    setTimeout(() => {
      let response = 'Try dropping a file onto the upload zone above, or ask about "pdf errors", "collections", "multi-file", or "retry".';
      for (const { pattern, text } of BOT_RESPONSES) {
        if (pattern.test(q)) { response = text; break; }
      }
      if (/chunk|how many|count/i.test(q)) {
        const total = docs.reduce((s, d) => s + d.chunkCount, 0);
        const ready = docs.filter(d => d.status === 'ready').length;
        response = `You have ${ready} ready document${ready !== 1 ? 's' : ''} with ${total.toLocaleString()} total chunks indexed and searchable.`;
      }
      setMsgs(prev => [...prev, { role: 'bot', text: response }]);
    }, 300);
  };

  const quickReplies = ['PDF not reading?', 'Multi-file upload?', 'Collection error?', 'How many chunks?'];
  const errorCount = docs.filter(d => d.status === 'error').length;

  return (
    <div className="glass rounded-2xl overflow-hidden border border-border/50">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-bg-hover/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 border border-accent/20">
            <Bot className="h-3.5 w-3.5 text-accent" />
          </div>
          <span className="text-sm font-semibold">Upload Assistant</span>
          {errorCount > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-danger/10 border border-danger/20 px-2 py-0.5 text-[10px] font-bold text-danger">
              <span className="h-1.5 w-1.5 rounded-full bg-danger animate-pulse" />
              {errorCount} error{errorCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-text-muted" /> : <ChevronDown className="h-4 w-4 text-text-muted" />}
      </button>

      {open && (
        <div className="border-t border-border/50">
          <div className="h-44 overflow-y-auto px-3 py-3 space-y-2">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'bot' && (
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 border border-accent/20 mr-1.5 mt-0.5">
                    <Bot className="h-3 w-3 text-accent" />
                  </div>
                )}
                <div className={`rounded-xl px-3 py-2 text-xs leading-relaxed max-w-[85%] ${
                  m.role === 'user'
                    ? 'bg-accent text-white rounded-tr-sm'
                    : 'bg-bg-card border border-border text-text-secondary rounded-tl-sm'
                }`}>{m.text}</div>
              </div>
            ))}
            {msgs.length === 1 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {quickReplies.map(q => (
                  <button
                    key={q} onClick={() => send(q)}
                    className="rounded-lg border border-border bg-bg-card/60 px-2 py-1 text-[10px] text-text-muted hover:text-text-primary hover:border-accent/20 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div className="flex items-center gap-2 border-t border-border/50 px-3 py-2">
            <input
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask about uploads, errors, PDFs…"
              className="flex-1 bg-transparent text-xs text-text-primary placeholder:text-text-muted outline-none py-1"
            />
            <button
              onClick={() => send()} disabled={!input.trim()}
              className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent text-white disabled:opacity-30 hover:opacity-90 transition-opacity"
            >
              <Zap className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Upload Zone ──────────────────────────────────────────────────────────────
type FileStatus = 'pending' | 'uploading' | 'done' | 'error';

function UploadZone({
  collections, initialCollectionId, forceCollId, onCreate, onNeedCollection,
}: {
  collections: Collection[];
  initialCollectionId: string;
  forceCollId?: string;
  onCreate: (doc: DocumentMeta) => void;
  onNeedCollection: () => void;
}) {
  const { success, error: toastError, info, warning } = useToast();
  const [files, setFiles]           = useState<File[]>([]);
  const [uploading, setUploading]   = useState(false);
  const [progress, setProgress]     = useState<Record<string, FileStatus>>({});
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});
  const [dragOver, setDragOver]     = useState(false);
  const [targetColl, setTargetColl] = useState(initialCollectionId || collections[0]?.id || '');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-select when first collection loads
  useEffect(() => {
    if (!targetColl && collections.length > 0) setTargetColl(collections[0].id);
  }, [collections, targetColl]);

  // Auto-select when parent forces a new collection (e.g. just created)
  useEffect(() => {
    if (forceCollId) setTargetColl(forceCollId);
  }, [forceCollId]);

  const addFiles = (added: FileList | File[]) => {
    const arr = Array.from(added);
    const invalid: string[] = [];
    const valid: File[] = [];

    for (const f of arr) {
      const err = validateFile(f);
      if (err) invalid.push(err);
      else valid.push(f);
    }

    if (invalid.length > 0) {
      invalid.forEach(msg => toastError('File rejected', msg));
    }

    if (valid.length > 0) {
      setFiles(prev => {
        const names = new Set(prev.map(f => f.name));
        const fresh = valid.filter(f => !names.has(f.name));
        if (fresh.length > 0) {
          info(
            `${fresh.length} file${fresh.length > 1 ? 's' : ''} queued`,
            fresh.length > 1
              ? `${fresh.map(f => f.name.slice(0, 18)).join(', ')} — click "Upload & index" to start.`
              : `${fresh[0].name} — ready to upload.`
          );
        }
        return [...prev, ...fresh];
      });
    }
  };

  const removeFile = (name: string) => {
    setFiles(prev => prev.filter(f => f.name !== name));
    setProgress(p => { const n = { ...p }; delete n[name]; return n; });
    setFileErrors(e => { const n = { ...e }; delete n[name]; return n; });
  };

  const uploadAll = async () => {
    if (!files.length) { warning('No files selected', 'Add at least one file to upload.'); return; }
    if (!targetColl) { toastError('No collection selected', 'Create a collection first, then upload.'); onNeedCollection(); return; }

    const collectionValid = collections.some(c => c.id === targetColl);
    if (!collectionValid) {
      toastError('Collection not found', 'This collection no longer exists. Create a new one.');
      onNeedCollection(); return;
    }

    // Verify on server (prevents stale cache)
    try {
      const fresh = await fetch('/api/collections').then(r => r.json());
      const serverValid = (fresh.collections || []).some((c: Collection) => c.id === targetColl);
      if (!serverValid) {
        toastError('Collection out of sync', 'Collection removed from database. Create a new collection and retry.');
        onNeedCollection(); return;
      }
    } catch { /* server will validate */ }

    setUploading(true);
    const init: Record<string, FileStatus> = {};
    files.forEach(f => { init[f.name] = 'pending'; });
    setProgress(init);
    setFileErrors({});

    const pending = files.filter(f => !progress[f.name] || progress[f.name] === 'pending');
    info('Uploading…', `Processing ${pending.length} file${pending.length > 1 ? 's' : ''} — indexing into pgvector.`);

    let doneCount = 0, failCount = 0;

    for (const file of files) {
      if (progress[file.name] === 'done') { doneCount++; continue; }
      setProgress(p => ({ ...p, [file.name]: 'uploading' }));
      const form = new FormData();
      form.append('file', file);
      form.append('collectionId', targetColl);
      try {
        const res  = await fetch('/api/ingest', { method: 'POST', body: form });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || 'Upload failed');
        setProgress(p => ({ ...p, [file.name]: 'done' }));
        if (data.document) onCreate(data.document);
        doneCount++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed';
        setProgress(p => ({ ...p, [file.name]: 'error' }));
        setFileErrors(e => ({ ...e, [file.name]: msg }));
        toastError(`Failed: ${file.name.slice(0, 28)}`, msg.slice(0, 100));
        if (/COLLECTION_NOT_FOUND|collection.*not.*exist/i.test(msg)) onNeedCollection();
        failCount++;
      }
    }

    setUploading(false);

    if (doneCount > 0 && failCount === 0) {
      success(
        `${doneCount} file${doneCount > 1 ? 's' : ''} indexed!`,
        'Go to Chat to ask questions about your documents.'
      );
      setTimeout(() => { setFiles([]); setProgress({}); }, 2000);
    } else if (doneCount > 0) {
      success(`${doneCount} indexed`, `${failCount} failed — ask the Upload Assistant for help.`);
    } else {
      toastError('All uploads failed', 'Ask the Upload Assistant below for help diagnosing the issue.');
    }
  };

  const selColl       = collections.find(c => c.id === targetColl);
  const pendingCount   = files.filter(f => !progress[f.name] || progress[f.name] === 'pending').length;
  const uploadingCount = files.filter(f => progress[f.name] === 'uploading').length;
  const doneCount      = files.filter(f => progress[f.name] === 'done').length;
  const errorCount     = files.filter(f => progress[f.name] === 'error').length;
  const remaining      = pendingCount + uploadingCount;

  return (
    <div className="space-y-3">
      {/* Collection selector */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-xs font-medium text-text-secondary">
          <FolderOpen className="h-3.5 w-3.5" /> Target Collection
        </label>
        {collections.length === 0 ? (
          <button
            onClick={onNeedCollection}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-accent/40 bg-accent/5 px-3 py-2.5 text-xs font-medium text-accent hover:bg-accent/10 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Create your first collection
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <select
              value={targetColl} onChange={e => setTargetColl(e.target.value)}
              className="flex-1 rounded-xl border border-border bg-bg-card px-3 py-2 text-sm text-text-primary outline-none focus:border-accent/50 transition-colors"
            >
              {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button
              onClick={onNeedCollection} title="New collection"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-bg-card hover:border-accent/30 hover:bg-bg-hover transition-colors"
            >
              <Plus className="h-4 w-4 text-text-muted" />
            </button>
          </div>
        )}
        {selColl && (
          <p className="text-[10px] text-text-muted pl-1">
            Uploading to <span className="text-text-secondary font-medium">{selColl.name}</span>
            {selColl.description && ` · ${selColl.description}`}
          </p>
        )}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed cursor-pointer transition-all py-8 px-4 ${
          dragOver
            ? 'border-accent bg-accent/8 scale-[1.01] shadow-lg shadow-accent/10'
            : 'border-border hover:border-accent/40 hover:bg-bg-hover/30'
        }`}
      >
        {dragOver ? (
          <Upload className="h-9 w-9 text-accent animate-bounce" />
        ) : (
          <UploadCloud className="h-8 w-8 text-text-muted transition-colors" />
        )}
        <div className="text-center">
          <p className="text-sm font-medium">
            {dragOver ? 'Drop files here!' : 'Drop files or click to browse'}
          </p>
          <p className="text-xs text-text-muted mt-0.5">PDF, MD, TXT, CSV, JSON, code · Max 15 MB · Multi-file supported</p>
        </div>

        {/* Live queue badge inside drop zone */}
        {files.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-accent font-medium">
              <Files className="h-3 w-3" />
              {files.length} file{files.length > 1 ? 's' : ''} queued
            </span>
            {doneCount > 0 && (
              <span className="flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2 py-1 text-success font-medium">
                <CheckCircle2 className="h-3 w-3" /> {doneCount} done
              </span>
            )}
            {errorCount > 0 && (
              <span className="flex items-center gap-1 rounded-full border border-danger/30 bg-danger/10 px-2 py-1 text-danger font-medium">
                <AlertCircle className="h-3 w-3" /> {errorCount} failed
              </span>
            )}
            {uploadingCount > 0 && (
              <span className="flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2 py-1 text-accent font-medium">
                <Loader2 className="h-3 w-3 animate-spin" /> uploading…
              </span>
            )}
          </div>
        )}
        <input
          ref={inputRef} type="file" multiple
          accept=".pdf,.txt,.md,.markdown,.csv,.json,.tsv,.js,.ts,.tsx,.jsx,.py,.java,.c,.cpp,.go,.rs,.rb,.php,.html,.css,.yml,.yaml,.xml,.sql,.log"
          className="hidden" onChange={e => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {/* File queue list */}
      {files.length > 0 && (
        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-0.5">
          {files.map(f => {
            const st  = progress[f.name];
            const err = fileErrors[f.name];
            return (
              <div
                key={f.name}
                className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-colors ${
                  st === 'done'        ? 'border-success/20 bg-success/5'
                  : st === 'error'     ? 'border-danger/20 bg-danger/5'
                  : st === 'uploading' ? 'border-accent/20 bg-accent/5'
                  : 'border-border bg-bg-card/60'
                }`}
              >
                <FileTypeIcon name={f.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{f.name}</p>
                  {err
                    ? <p className="text-[10px] text-danger mt-0.5 line-clamp-2">{err}</p>
                    : <p className="text-[10px] text-text-muted">{formatBytes(f.size)}</p>}
                </div>
                {!st && (
                  <button
                    onClick={e => { e.stopPropagation(); removeFile(f.name); }}
                    className="p-1 rounded text-text-muted hover:text-danger transition-colors shrink-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                {st === 'uploading' && <Loader2 className="h-4 w-4 animate-spin text-accent shrink-0" />}
                {st === 'done'      && <CheckCircle2 className="h-4 w-4 text-success shrink-0" />}
                {st === 'error'     && <AlertCircle  className="h-4 w-4 text-danger shrink-0" />}
              </div>
            );
          })}
        </div>
      )}

      {/* Upload button — shows when files are queued */}
      {files.length > 0 && (
        <button
          onClick={uploadAll}
          disabled={uploading || !targetColl || collections.length === 0}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity shadow-md shadow-accent/20"
        >
          {uploading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Indexing{remaining > 0 ? ` (${remaining} remaining)` : '…'}</>
          ) : (
            <><Zap className="h-4 w-4" /> Upload &amp; index {files.length} file{files.length > 1 ? 's' : ''}</>
          )}
        </button>
      )}
    </div>
  );
}

// ─── Document Row ─────────────────────────────────────────────────────────────
function DocRow({
  doc, collections, selected, onSelect, onDelete, onPreview,
}: {
  doc: DocumentMeta; collections: Collection[]; selected: boolean;
  onSelect: (id: string, c: boolean) => void;
  onDelete: (id: string) => void; onPreview: (d: DocumentMeta) => void;
}) {
  const [showErr, setShowErr] = useState(false);
  const collName = collections.find(c => c.id === doc.collectionId)?.name || doc.collectionId.slice(0, 8);

  return (
    <div className={`flex flex-col border-b border-border/50 hover:bg-bg-hover/40 transition-colors group ${selected ? 'bg-accent/5' : ''}`}>
      <div className="flex items-center gap-3 px-4 py-3">
        <input
          type="checkbox" checked={selected}
          onChange={e => onSelect(doc.id, e.target.checked)}
          className="h-3.5 w-3.5 rounded border-border accent-accent shrink-0"
        />
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bg-secondary border border-border">
          <FileTypeIcon name={doc.name} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{doc.name}</p>
          <div className="flex flex-wrap items-center gap-x-2.5 mt-0.5">
            <span className="text-[11px] text-text-muted">{collName}</span>
            <span className="text-[11px] text-text-muted">{formatBytes(doc.size)}</span>
            {doc.chunkCount > 0 && <span className="text-[11px] text-text-muted">{doc.chunkCount} chunks</span>}
            <span className="text-[11px] text-text-muted">{relativeTime(doc.createdAt)}</span>
          </div>
        </div>
        <span className={`hidden sm:inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium shrink-0 ${statusClass(doc.status)}`}>
          {doc.status === 'processing' && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
          {doc.status === 'ready'      && <span className="h-1.5 w-1.5 rounded-full bg-success" />}
          {doc.status === 'error'      && <span className="h-1.5 w-1.5 rounded-full bg-danger" />}
          {doc.status}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {doc.status === 'error' && (
            <button
              onClick={() => setShowErr(o => !o)}
              className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
              title="View error"
            >
              <AlertCircle className="h-3.5 w-3.5" />
            </button>
          )}
          {doc.status === 'ready' && (
            <button
              onClick={() => onPreview(doc)}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-card transition-colors"
              title="Preview chunks"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          )}
          <Link
            href={`/chat?collectionId=${doc.collectionId}`}
            className="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
            title="Chat about this document"
          >
            <MessageSquare className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={() => onDelete(doc.id)}
            className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {doc.status === 'error' && doc.error && showErr && (
        <div className="mx-4 mb-3 rounded-xl border border-danger/20 bg-danger/5 px-3 py-2.5">
          <p className="text-[11px] font-semibold text-danger mb-1">Error details</p>
          <p className="text-[11px] text-text-secondary leading-relaxed">{doc.error}</p>
          <button
            onClick={() => navigator.clipboard.writeText(doc.error!)}
            className="mt-2 flex items-center gap-1 text-[10px] text-text-muted hover:text-text-primary transition-colors"
          >
            <Copy className="h-3 w-3" /> Copy error
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DocumentsPage() {
  const { collections, refresh: refreshCols } = useCollections();
  const { success, error: toastError }        = useToast();

  const [docs, setDocs]                 = useState<DocumentMeta[]>([]);
  const [loading, setLoading]           = useState(true);
  const [filterColl, setFilterColl]     = useState('');
  const [filterStatus, setFilterStatus] = useState<'' | 'ready' | 'error' | 'processing'>('');
  const [search, setSearch]             = useState('');
  const [sort, setSort]                 = useState<SortField>('createdAt');
  const [sortDir, setSortDir]           = useState<SortDir>('desc');
  const [selected, setSelected]         = useState<Set<string>>(new Set());
  const [previewDoc, setPreviewDoc]     = useState<DocumentMeta | null>(null);
  const [showCreateColl, setShowCreate] = useState(false);
  const [dbHealth, setDbHealth]         = useState<DbHealth>(null);
  // Track newly created collection so UploadZone auto-selects it
  const [forceCollId, setForceCollId]   = useState('');

  const loadDocs = useCallback(async () => {
    try {
      const url = filterColl ? `/api/documents?collectionId=${filterColl}` : '/api/documents';
      const d   = await fetch(url).then(r => r.json());
      setDocs(d.documents || []);
    } catch {
      toastError('Could not load documents', 'Check your connection and refresh.');
    } finally { setLoading(false); }
  }, [filterColl, toastError]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  // Auto-refresh processing docs every 3 s
  useEffect(() => {
    if (!docs.some(d => d.status === 'processing')) return;
    const t = setInterval(loadDocs, 3000);
    return () => clearInterval(t);
  }, [docs, loadDocs]);

  // DB health check on mount
  useEffect(() => {
    fetch('/api/health').then(r => r.json()).then(setDbHealth).catch(() => undefined);
  }, []);

  const deleteDoc = async (id: string) => {
    if (!confirm('Delete this document and all its indexed chunks? This cannot be undone.')) return;
    await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    setDocs(prev => prev.filter(d => d.id !== id));
    setSelected(prev => { const s = new Set(prev); s.delete(id); return s; });
    success('Document deleted');
  };

  const deleteSelected = async () => {
    if (!confirm(`Delete ${selected.size} document${selected.size > 1 ? 's' : ''}?`)) return;
    await Promise.all([...selected].map(id => fetch(`/api/documents/${id}`, { method: 'DELETE' })));
    const n = selected.size;
    setDocs(prev => prev.filter(d => !selected.has(d.id)));
    setSelected(new Set());
    success(`${n} document${n > 1 ? 's' : ''} deleted`);
  };

  const handleSelect = (id: string, c: boolean) =>
    setSelected(prev => { const s = new Set(prev); c ? s.add(id) : s.delete(id); return s; });
  const toggleAll  = (c: boolean) => setSelected(c ? new Set(filtered.map(d => d.id)) : new Set());
  const toggleSort = (f: SortField) => {
    if (sort === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSort(f); setSortDir('desc'); }
  };

  const filtered = useMemo(() => {
    let list = [...docs];
    if (filterColl)   list = list.filter(d => d.collectionId === filterColl);
    if (filterStatus) list = list.filter(d => d.status === filterStatus);
    if (search)       list = list.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));
    list.sort((a, b) => {
      const m = sortDir === 'asc' ? 1 : -1;
      if (sort === 'name')   return m * a.name.localeCompare(b.name);
      if (sort === 'size')   return m * (a.size - b.size);
      if (sort === 'status') return m * a.status.localeCompare(b.status);
      return m * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    });
    return list;
  }, [docs, filterColl, filterStatus, search, sort, sortDir]);

  const readyCount  = docs.filter(d => d.status === 'ready').length;
  const errorCount  = docs.filter(d => d.status === 'error').length;
  const totalChunks = docs.reduce((s, d) => s + d.chunkCount, 0);
  const totalSize   = docs.reduce((s, d) => s + d.size, 0);

  const SortBtn = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => toggleSort(field)}
      className="flex items-center gap-1 text-[11px] font-semibold text-text-muted hover:text-text-primary transition-colors"
    >
      {label} {sort === field
        ? (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)
        : <Filter className="h-3 w-3 opacity-30" />}
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
              <h1 className="mt-1 text-2xl font-bold tracking-tight">Upload &amp; Manage Documents</h1>
              <p className="mt-1 text-sm text-text-secondary">
                Add PDFs, notes, datasets, and code files. DocuMind chunks and embeds them for cited AI answers.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/chat"
                className="flex items-center gap-1.5 rounded-xl border border-accent/30 bg-accent/5 px-3 py-2 text-xs font-medium text-accent hover:bg-accent/10 transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5" /> Chat
              </Link>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-1.5 rounded-xl border border-border bg-bg-card px-3 py-2 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> New Collection
              </button>
              <button
                onClick={loadDocs}
                className="flex items-center gap-1.5 rounded-xl border border-border bg-bg-card px-3 py-2 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </button>
            </div>
          </div>

          <DbHealthBanner health={dbHealth} />

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Ready',        value: readyCount,                    color: 'text-success',      Icon: CheckCircle2 },
              { label: 'Errors',       value: errorCount,                    color: 'text-danger',       Icon: AlertCircle  },
              { label: 'Total Chunks', value: totalChunks.toLocaleString(),  color: 'text-accent',       Icon: Layers       },
              { label: 'Stored',       value: formatBytes(totalSize),        color: 'text-text-primary', Icon: Database     },
            ].map(({ label, value, color, Icon }) => (
              <div key={label} className="glass rounded-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-text-muted">{label}</p>
                  <Icon className={`h-3.5 w-3.5 ${color} opacity-60`} />
                </div>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* 0-chunk warning */}
          {docs.length > 0 && totalChunks === 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/8 px-4 py-3">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-warning">No chunks indexed yet</p>
                <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                  All documents have errors. Check error details on each row and use the Upload Assistant for guidance.
                  Chat will not return useful answers until at least one document is indexed.
                </p>
              </div>
              <Link href="/chat" className="shrink-0 flex items-center gap-1 text-[11px] text-accent hover:opacity-70 transition-opacity">
                <Sparkles className="h-3 w-3" /> Try General AI
              </Link>
            </div>
          )}

          {/* First-time onboarding banner */}
          {collections.length === 0 && docs.length === 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-accent/20 bg-accent/5 px-4 py-3">
              <Info className="h-4 w-4 text-accent shrink-0" />
              <p className="text-sm text-text-secondary">
                Start by creating a collection, then upload your documents. Collections keep your files organized and searchable.
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="shrink-0 flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
              >
                <Plus className="h-3 w-3" /> Create collection
              </button>
            </div>
          )}

          {/* Two-column layout */}
          <div className="grid gap-6 lg:grid-cols-5">

            {/* ── Left panel — sticky scrollable sidebar ── */}
            <div className="lg:col-span-2">
              <div className="sticky top-4 flex flex-col gap-4 max-h-[calc(100vh-7rem)] overflow-y-auto pb-2">

                {/* Upload panel */}
                <div className="glass rounded-2xl p-5 space-y-4 shrink-0">
                  <h2 className="font-bold text-sm flex items-center gap-2">
                    <UploadCloud className="h-4 w-4 text-accent" /> Add Documents
                  </h2>
                  <UploadZone
                    collections={collections}
                    initialCollectionId={filterColl || collections[0]?.id || ''}
                    forceCollId={forceCollId}
                    onCreate={doc => { setDocs(prev => [doc, ...prev]); refreshCols(); }}
                    onNeedCollection={() => setShowCreate(true)}
                  />
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-[11px] text-text-muted font-semibold mb-2 uppercase tracking-wider">Supported Formats</p>
                    <div className="flex flex-wrap gap-1.5">
                      {['PDF','MD','TXT','CSV','JSON','JS/TS','Python','SQL','YAML','HTML'].map(f => (
                        <span key={f} className="rounded-md border border-border/60 bg-bg-secondary/40 px-2 py-0.5 text-[10px] font-mono text-text-muted">{f}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Upload Bot — always visible in sidebar */}
                <div className="shrink-0">
                  <UploadBot docs={docs} dbHealth={dbHealth} />
                </div>

              </div>
            </div>

            {/* ── Right panel — document list ── */}
            <div className="lg:col-span-3 space-y-3">

              {/* Filters */}
              <div className="glass rounded-xl px-4 py-3 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative flex-1 min-w-[140px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
                    <input
                      value={search} onChange={e => setSearch(e.target.value)}
                      placeholder="Filter filenames…"
                      className="w-full rounded-lg border border-border bg-bg-secondary/50 pl-8 pr-3 py-1.5 text-xs outline-none focus:border-accent/50 transition-colors"
                    />
                  </div>
                  <select
                    value={filterStatus} onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}
                    className="rounded-lg border border-border bg-bg-secondary/50 px-2.5 py-1.5 text-xs text-text-secondary outline-none focus:border-accent/50 transition-colors"
                  >
                    <option value="">All status</option>
                    <option value="ready">Ready</option>
                    <option value="processing">Processing</option>
                    <option value="error">Error</option>
                  </select>
                  <select
                    value={filterColl} onChange={e => setFilterColl(e.target.value)}
                    className="rounded-lg border border-border bg-bg-secondary/50 px-2.5 py-1.5 text-xs text-text-secondary outline-none focus:border-accent/50 transition-colors"
                  >
                    <option value="">All collections</option>
                    {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="flex items-center justify-between text-[11px] text-text-muted">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selected.size === filtered.length && filtered.length > 0}
                        onChange={e => toggleAll(e.target.checked)}
                        className="h-3 w-3 rounded accent-accent"
                      />
                      {selected.size > 0 ? `${selected.size} selected` : 'Select all'}
                    </label>
                    {selected.size > 0 && (
                      <button onClick={deleteSelected} className="flex items-center gap-1 text-danger hover:opacity-80 transition-opacity">
                        <Trash2 className="h-3 w-3" /> Delete selected
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <SortBtn field="name"      label="Name" />
                    <SortBtn field="size"      label="Size" />
                    <SortBtn field="createdAt" label="Date" />
                    <SortBtn field="status"    label="Status" />
                  </div>
                </div>
              </div>

              {/* Document table */}
              <div className="glass rounded-xl overflow-hidden">
                <div className="border-b border-border px-4 py-2.5 flex items-center justify-between">
                  <p className="text-xs font-semibold text-text-secondary flex items-center gap-2">
                    Indexed documents
                    {docs.some(d => d.status === 'processing') && (
                      <span className="inline-flex items-center gap-1 text-accent font-normal">
                        <Loader2 className="h-3 w-3 animate-spin" /> Auto-refreshing…
                      </span>
                    )}
                    <span className="text-text-muted font-normal">{filtered.length} shown</span>
                  </p>
                  {errorCount > 0 && (
                    <button
                      onClick={() => setFilterStatus(filterStatus === 'error' ? '' : 'error')}
                      className={`flex items-center gap-1 text-[10px] transition-opacity ${filterStatus === 'error' ? 'text-accent' : 'text-danger hover:opacity-70'}`}
                    >
                      <AlertCircle className="h-3 w-3" /> {errorCount} error{errorCount > 1 ? 's' : ''}
                    </button>
                  )}
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-accent" />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                    <FileText className="h-12 w-12 text-text-muted opacity-20 mb-3" />
                    <p className="font-medium text-text-secondary">
                      {docs.length === 0 ? 'No documents yet' : 'No documents match'}
                    </p>
                    <p className="text-sm text-text-muted mt-1">
                      {docs.length === 0 ? 'Upload files using the panel on the left.' : 'Try adjusting your filters.'}
                    </p>
                    {docs.length === 0 && (
                      <Link href="/chat" className="mt-4 flex items-center gap-1.5 text-xs text-accent hover:underline">
                        <ArrowRight className="h-3.5 w-3.5" /> Or try General AI chat instead
                      </Link>
                    )}
                  </div>
                ) : (
                  filtered.map(doc => (
                    <DocRow
                      key={doc.id} doc={doc} collections={collections}
                      selected={selected.has(doc.id)} onSelect={handleSelect}
                      onDelete={deleteDoc} onPreview={setPreviewDoc}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {previewDoc && <PreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />}

      {showCreateColl && (
        <CreateCollectionModal
          onCreated={c => {
            refreshCols();
            setForceCollId(c.id); // auto-select the new collection in UploadZone
          }}
          onClose={() => setShowCreate(false)}
        />
      )}
    </AuthGate>
  );
}
