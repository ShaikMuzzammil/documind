'use client';

import { useState } from 'react';
import { useCollections } from '@/lib/use-collections';
import AuthGate from '@/components/app/AuthGate';
import {
  Download, FileText, FolderOpen, MessageSquare,
  CheckCircle2, AlertCircle, Loader2, ChevronRight,
} from 'lucide-react';

type ExportState = 'idle' | 'loading' | 'done' | 'error';

function ExportCard({
  icon: Icon, title, description, format, onExport, state, hint,
}: {
  icon: React.ElementType; title: string; description: string;
  format: string; onExport: () => void; state: ExportState; hint?: string;
}) {
  return (
    <div className="glass card-glow rounded-2xl p-5 transition-all duration-200">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h3 className="font-semibold text-sm">{title}</h3>
              <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{description}</p>
              {hint && <p className="text-[10px] text-text-muted mt-1 font-mono">{hint}</p>}
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-bg-card border border-border text-text-muted shrink-0">
              {format}
            </span>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={onExport}
              disabled={state === 'loading'}
              className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-colors"
            >
              {state === 'loading' ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" />Exporting…</>
              ) : (
                <><Download className="w-3.5 h-3.5" />Export</>
              )}
            </button>
            {state === 'done' && (
              <span className="flex items-center gap-1 text-xs text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />Download started
              </span>
            )}
            {state === 'error' && (
              <span className="flex items-center gap-1 text-xs text-red-400">
                <AlertCircle className="w-3.5 h-3.5" />Export failed
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportPage() {
  const { collections } = useCollections();
  const [states, setStates] = useState<Record<string, ExportState>>({});

  const setState = (key: string, s: ExportState) => setStates((p) => ({ ...p, [key]: s }));

  const exportDocumentsCSV = async () => {
    setState('docs', 'loading');
    try {
      const res = await fetch('/api/export/documents');
      if (!res.ok) throw new Error(`${res.status}`);
      const blob = await res.blob();
      downloadBlob(blob, `documind-documents-${Date.now()}.csv`);
      setState('docs', 'done');
    } catch { setState('docs', 'error'); }
  };

  const exportCollectionsJSON = async () => {
    setState('cols', 'loading');
    try {
      const res = await fetch('/api/export/collections');
      if (!res.ok) throw new Error(`${res.status}`);
      const blob = await res.blob();
      downloadBlob(blob, `documind-collections-${Date.now()}.json`);
      setState('cols', 'done');
    } catch { setState('cols', 'error'); }
  };

  const exportCollectionReport = async (id: string, name: string) => {
    const key = `col_${id}`;
    setState(key, 'loading');
    try {
      const res = await fetch('/api/export/collections');
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      const col = data.collections.find((c: { id: string }) => c.id === id);
      if (!col) throw new Error('not found');
      const blob = new Blob([JSON.stringify(col, null, 2)], { type: 'application/json' });
      downloadBlob(blob, `${name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.json`);
      setState(key, 'done');
    } catch { setState(key, 'error'); }
  };

  return (
    <AuthGate>
      <div className="min-h-[calc(100vh-4rem)] px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">

          <header>
            <p className="text-xs font-mono font-bold tracking-widest text-text-muted">DATA PORTABILITY</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Export</h1>
            <p className="mt-2 text-sm text-text-secondary max-w-2xl">
              Download your documents, collections, and analytics data in open formats — CSV, JSON, and Markdown.
              Your data is always yours.
            </p>
          </header>

          {/* Global exports */}
          <section>
            <h2 className="text-xs font-mono font-bold tracking-widest text-violet-400 mb-4">GLOBAL EXPORTS</h2>
            <div className="space-y-3">
              <ExportCard
                icon={FileText}
                title="Documents manifest"
                description="All your indexed documents with collection name, file type, size, chunk count, and status — one row per document."
                format=".CSV"
                hint="Opens in Excel, Google Sheets, or any spreadsheet app"
                onExport={exportDocumentsCSV}
                state={states.docs ?? 'idle'}
              />
              <ExportCard
                icon={FolderOpen}
                title="Collections report"
                description="All collections with their documents and aggregate statistics — total docs, chunks, size, and per-document metadata."
                format=".JSON"
                hint="Machine-readable — includes all doc metadata per collection"
                onExport={exportCollectionsJSON}
                state={states.cols ?? 'idle'}
              />
            </div>
          </section>

          {/* Per-collection exports */}
          {collections.length > 0 && (
            <section>
              <h2 className="text-xs font-mono font-bold tracking-widest text-cyan-400 mb-4">PER-COLLECTION EXPORTS</h2>
              <div className="space-y-3">
                {collections.map((col) => (
                  <ExportCard
                    key={col.id}
                    icon={FolderOpen}
                    title={col.name}
                    description={col.description || 'Export this collection with its documents and statistics as a JSON report.'}
                    format=".JSON"
                    hint={`collection id: ${col.id}`}
                    onExport={() => exportCollectionReport(col.id, col.name)}
                    state={states[`col_${col.id}`] ?? 'idle'}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Chat export info */}
          <section className="glass rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm mb-1">Chat history export</h3>
                <p className="text-xs text-text-secondary leading-relaxed mb-3">
                  Chat conversations are exported directly from the Chat page. Open any chat, ask your questions, 
                  then click the <strong className="text-text-primary">Export Chat</strong> button in the header to download the full conversation as Markdown — including all citations and source passages.
                </p>
                <a
                  href="/chat"
                  className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Go to Chat <ChevronRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </section>

          {/* Format reference */}
          <section className="glass rounded-2xl p-6">
            <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <Download className="w-4 h-4 text-text-muted" />
              Export format reference
            </h2>
            <div className="grid sm:grid-cols-3 gap-4 text-xs">
              {[
                { fmt: 'CSV', color: 'text-emerald-400', items: ['UTF-8 encoding', 'RFC 4180 compliant', 'Header row included', 'Opens in Excel/Sheets'] },
                { fmt: 'JSON', color: 'text-violet-400', items: ['Pretty-printed (2-space)', 'UTF-8 encoding', 'camelCase keys', 'Nested metadata'] },
                { fmt: 'Markdown', color: 'text-cyan-400', items: ['GitHub-flavored MD', 'Includes citations', 'Source passages quoted', 'Similarity scores'] },
              ].map(({ fmt, color, items }) => (
                <div key={fmt} className="border border-border rounded-xl p-4">
                  <p className={`font-mono font-bold text-sm mb-2 ${color}`}>.{fmt.toLowerCase()}</p>
                  <ul className="space-y-1">
                    {items.map((item) => (
                      <li key={item} className="text-text-muted flex items-center gap-1.5">
                        <span className={`w-1 h-1 rounded-full ${color} opacity-60`} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </AuthGate>
  );
}
