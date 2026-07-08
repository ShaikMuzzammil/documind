'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Download, FileText, MessageSquare, Database, Code2,
  Loader2, CheckCircle2, AlertCircle, FolderOpen, Layers,
  ChevronRight, FileJson, FileCode, Sheet,
} from 'lucide-react';
import AuthGate from '@/components/app/AuthGate';
import { useCollections } from '@/lib/use-collections';

type ExportFormat = 'json' | 'csv' | 'markdown' | 'jsonl';
type ExportTarget = 'documents' | 'chunks' | 'sessions';

const FORMATS: { id: ExportFormat; label: string; desc: string; icon: React.ElementType; ext: string }[] = [
  { id: 'json', label: 'JSON', desc: 'Structured data with full metadata', icon: FileJson, ext: '.json' },
  { id: 'csv', label: 'CSV', desc: 'Spreadsheet-compatible flat table', icon: Sheet, ext: '.csv' },
  { id: 'markdown', label: 'Markdown', desc: 'Human-readable formatted text', icon: FileText, ext: '.md' },
  { id: 'jsonl', label: 'JSONL', desc: 'Newline-delimited JSON for ML/LLMs', icon: FileCode, ext: '.jsonl' },
];

const TARGETS: { id: ExportTarget; label: string; desc: string; icon: React.ElementType }[] = [
  { id: 'documents', label: 'Document Index', desc: 'Metadata for all indexed documents', icon: FileText },
  { id: 'chunks', label: 'Knowledge Chunks', desc: 'All text chunks with collection info', icon: Layers },
  { id: 'sessions', label: 'Chat History', desc: 'All conversations and AI responses', icon: MessageSquare },
];

function formatData(data: Record<string, unknown>[], format: ExportFormat, target: string): { content: string; mimeType: string; ext: string } {
  if (format === 'json') {
    return { content: JSON.stringify({ export: target, count: data.length, exportedAt: new Date().toISOString(), data }, null, 2), mimeType: 'application/json', ext: '.json' };
  }
  if (format === 'jsonl') {
    return { content: data.map(r => JSON.stringify(r)).join('\n'), mimeType: 'application/x-ndjson', ext: '.jsonl' };
  }
  if (format === 'csv') {
    if (!data.length) return { content: '', mimeType: 'text/csv', ext: '.csv' };
    const keys = Object.keys(data[0]);
    const escape = (v: unknown) => {
      const s = String(v ?? '').replace(/"/g, '""');
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
    };
    const rows = [keys.join(','), ...data.map(r => keys.map(k => escape(r[k])).join(','))];
    return { content: rows.join('\n'), mimeType: 'text/csv', ext: '.csv' };
  }
  // markdown
  const lines = [`# DocuMind Export — ${target}`, ``, `Exported: ${new Date().toLocaleString()}`, `Count: ${data.length}`, ``];
  data.forEach((item, i) => {
    lines.push(`## Item ${i + 1}`);
    lines.push('```json');
    lines.push(JSON.stringify(item, null, 2));
    lines.push('```');
    lines.push('');
  });
  return { content: lines.join('\n'), mimeType: 'text/markdown', ext: '.md' };
}

export default function ExportPage() {
  const { collections } = useCollections();
  const [target, setTarget] = useState<ExportTarget>('documents');
  const [format, setFormat] = useState<ExportFormat>('json');
  const [collectionId, setCollectionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const doExport = useCallback(async () => {
    setLoading(true); setStatus(null);
    try {
      let data: Record<string, unknown>[] = [];

      if (target === 'documents') {
        const url = collectionId ? `/api/documents?collectionId=${collectionId}` : '/api/documents';
        const r = await fetch(url);
        const d = await r.json();
        data = (d.documents || []).map((doc: Record<string, unknown>) => ({
          id: doc.id, name: doc.name, type: doc.type,
          size: doc.size, chunkCount: doc.chunkCount,
          status: doc.status, collectionId: doc.collectionId,
          createdAt: doc.createdAt,
        }));
      } else if (target === 'chunks') {
        const docsRes = await fetch(collectionId ? `/api/documents?collectionId=${collectionId}` : '/api/documents');
        const docsData = await docsRes.json();
        const docs: Record<string, unknown>[] = docsData.documents || [];
        const readyDocs = docs.filter(d => d.status === 'ready').slice(0, 50);
        for (const doc of readyDocs) {
          const r = await fetch(`/api/documents/${doc.id}/preview`);
          const d = await r.json();
          if (d.chunks) {
            (d.chunks as { index: number; text: string }[]).forEach((chunk) => {
              data.push({ documentId: doc.id, documentName: doc.name, collectionId: doc.collectionId, chunkIndex: chunk.index, text: chunk.text });
            });
          }
        }
      } else {
        const r = await fetch('/api/chat/sessions');
        const d = await r.json();
        const sessions: Record<string, unknown>[] = d.sessions || [];
        for (const session of sessions.slice(0, 30)) {
          const mr = await fetch(`/api/chat/sessions/${session.id}`);
          const md = await mr.json();
          data.push({
            sessionId: session.id, title: session.title, collectionId: session.collectionId,
            messageCount: session.messageCount, createdAt: session.createdAt, updatedAt: session.updatedAt,
            messages: md.messages || [],
          });
        }
      }

      const { content, mimeType, ext } = formatData(data, format, target);
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `documind-${target}-${new Date().toISOString().slice(0, 10)}${ext}`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatus({ type: 'success', text: `Exported ${data.length} ${target} as ${format.toUpperCase()}` });
    } catch (e) {
      setStatus({ type: 'error', text: e instanceof Error ? e.message : 'Export failed' });
    } finally { setLoading(false); }
  }, [target, format, collectionId]);

  return (
    <AuthGate>
      <div className="min-h-screen pb-24 lg:pb-8">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">

          <div>
            <p className="text-xs font-mono font-bold tracking-widest text-text-muted">EXPORT CENTER</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Export Your Data</h1>
            <p className="mt-1 text-sm text-text-secondary">Download documents, knowledge chunks, or chat history in multiple formats.</p>
          </div>

          {status && (
            <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${status.type === 'success' ? 'border-success/25 bg-success/10 text-success' : 'border-danger/25 bg-danger/10 text-danger'}`}>
              {status.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
              {status.text}
            </div>
          )}

          {/* Step 1: What to export */}
          <div className="glass rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white text-[10px] font-bold">1</span>
              What to export
            </h2>
            <div className="grid gap-2 sm:grid-cols-3">
              {TARGETS.map(({ id, label, desc, icon: Icon }) => (
                <button
                  key={id} onClick={() => setTarget(id)}
                  className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all ${target === id ? 'border-accent/40 bg-accent/8 ring-1 ring-accent/20' : 'border-border bg-bg-card/60 hover:border-border/80'}`}
                >
                  <Icon className={`h-5 w-5 ${target === id ? 'text-accent' : 'text-text-muted'}`} />
                  <div>
                    <p className="text-xs font-semibold text-text-primary">{label}</p>
                    <p className="text-[11px] text-text-muted mt-0.5">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Format */}
          <div className="glass rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white text-[10px] font-bold">2</span>
              Export format
            </h2>
            <div className="grid gap-2 sm:grid-cols-4">
              {FORMATS.map(({ id, label, desc, icon: Icon }) => (
                <button
                  key={id} onClick={() => setFormat(id)}
                  className={`flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all ${format === id ? 'border-accent/40 bg-accent/8 ring-1 ring-accent/20' : 'border-border bg-bg-card/60 hover:border-border/80'}`}
                >
                  <Icon className={`h-4 w-4 ${format === id ? 'text-accent' : 'text-text-muted'}`} />
                  <div>
                    <p className="text-xs font-bold text-text-primary">{label}</p>
                    <p className="text-[10px] text-text-muted mt-0.5">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Filter + Export */}
          <div className="glass rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white text-[10px] font-bold">3</span>
              Filter &amp; download
            </h2>

            {target !== 'sessions' && (
              <div className="flex items-center gap-3">
                <FolderOpen className="h-4 w-4 text-text-muted shrink-0" />
                <select value={collectionId} onChange={e => setCollectionId(e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-bg-secondary/50 px-3 py-2 text-sm text-text-secondary outline-none focus:border-accent/50 transition-colors">
                  <option value="">All collections</option>
                  {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}

            {/* Summary */}
            <div className="rounded-xl bg-bg-secondary/40 border border-border/50 px-4 py-3">
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>Target</span><span className="font-semibold text-text-primary capitalize">{target}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-text-muted mt-1">
                <span>Format</span><span className="font-semibold text-text-primary">{FORMATS.find(f => f.id === format)?.label} ({FORMATS.find(f => f.id === format)?.ext})</span>
              </div>
              {collectionId && (
                <div className="flex items-center justify-between text-xs text-text-muted mt-1">
                  <span>Collection</span><span className="font-semibold text-text-primary">{collections.find(c => c.id === collectionId)?.name}</span>
                </div>
              )}
            </div>

            <button
              onClick={doExport}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Preparing export…</> : <><Download className="h-4 w-4" /> Export {target} as {format.toUpperCase()}</>}
            </button>
          </div>

          {/* Info cards */}
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: Code2, title: 'JSONL for fine-tuning', desc: 'Use JSONL exports to fine-tune LLMs on your document knowledge.' },
              { icon: Database, title: 'Backup your workspace', desc: 'Export all data regularly to keep a backup of your knowledge base.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="glass rounded-xl p-4 flex gap-3">
                <Icon className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold">{title}</p>
                  <p className="text-[11px] text-text-muted mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AuthGate>
  );
}
