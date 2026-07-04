'use client';

import { useEffect, useState } from 'react';
import { Download, FileText, FolderOpen, Code, Table, CheckCircle2, Loader2 } from 'lucide-react';
import AuthGate from '@/components/app/AuthGate';
import { useCollections } from '@/lib/use-collections';
import { DocumentMeta } from '@/lib/types';
import { formatBytes } from '@/lib/utils';

export default function ExportPage() {
  const { collections } = useCollections();
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [exporting, setExporting] = useState<string | null>(null);
  const [exported, setExported] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/documents').then(r => r.json()).then(d => setDocuments(d.documents || [])).catch(() => {});
  }, []);

  const doExport = async (key: string, fn: () => void) => {
    setExporting(key);
    await new Promise(r => setTimeout(r, 300));
    fn();
    setExporting(null);
    setExported(key);
    setTimeout(() => setExported(null), 2000);
  };

  const exportDocumentsCSV = () => {
    const header = 'name,type,status,chunkCount,size,collection,createdAt';
    const collectionMap = new Map(collections.map(c => [c.id, c.name]));
    const rows = documents.map(d =>
      [`"${d.name}"`, d.type, d.status, d.chunkCount, d.size, `"${collectionMap.get(d.collectionId) || ''}"`, d.createdAt].join(',')
    );
    download(header + '\n' + rows.join('\n'), 'documind-documents.csv', 'text/csv');
  };

  const exportCollectionsJSON = () => {
    const data = collections.map(c => ({
      ...c,
      documentCount: documents.filter(d => d.collectionId === c.id).length,
      readyDocuments: documents.filter(d => d.collectionId === c.id && d.status === 'ready').length,
      totalChunks: documents.filter(d => d.collectionId === c.id).reduce((s, d) => s + d.chunkCount, 0),
    }));
    download(JSON.stringify(data, null, 2), 'documind-collections.json', 'application/json');
  };

  const exportWorkspaceMarkdown = () => {
    const collectionMap = new Map(collections.map(c => [c.id, c.name]));
    const lines = [
      '# DocuMind Workspace Export',
      `*Exported: ${new Date().toLocaleString()}*`,
      '',
      `## Summary`,
      `- Collections: ${collections.length}`,
      `- Documents: ${documents.length}`,
      `- Total chunks: ${documents.reduce((s, d) => s + d.chunkCount, 0)}`,
      `- Total size: ${formatBytes(documents.reduce((s, d) => s + d.size, 0))}`,
      '',
      '## Collections',
      ...collections.map(c => {
        const docs = documents.filter(d => d.collectionId === c.id);
        return `\n### ${c.name}\n${c.description ? c.description + '\n' : ''}Documents: ${docs.length}\n${docs.map(d => `- ${d.name} (${d.status}, ${d.chunkCount} chunks)`).join('\n')}`;
      }),
    ];
    download(lines.join('\n'), 'documind-workspace.md', 'text/markdown');
  };

  const download = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const EXPORTS = [
    {
      key: 'docs-csv',
      Icon: Table,
      title: 'Documents — CSV',
      desc: 'All documents with status, chunk count, file size, and collection assignment.',
      count: `${documents.length} documents`,
      disabled: documents.length === 0,
      action: exportDocumentsCSV,
      format: '.csv',
    },
    {
      key: 'collections-json',
      Icon: Code,
      title: 'Collections — JSON',
      desc: 'All collections with names, descriptions, document counts, and chunk totals.',
      count: `${collections.length} collections`,
      disabled: collections.length === 0,
      action: exportCollectionsJSON,
      format: '.json',
    },
    {
      key: 'workspace-md',
      Icon: FileText,
      title: 'Workspace Report — Markdown',
      desc: 'Human-readable report of your entire workspace: collections, documents, and stats.',
      count: `${documents.length} docs across ${collections.length} collections`,
      disabled: documents.length === 0,
      action: exportWorkspaceMarkdown,
      format: '.md',
    },
  ];

  return (
    <AuthGate>
      <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8 pb-24 lg:pb-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <p className="text-xs font-mono font-bold tracking-widest text-text-muted">WORKSPACE</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Export</h1>
            <p className="mt-1 text-sm text-text-secondary">Download your workspace data in open, portable formats.</p>
          </div>

          {/* Stats summary */}
          <div className="glass rounded-xl p-4 grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Documents', value: documents.length },
              { label: 'Collections', value: collections.length },
              { label: 'Total Size', value: formatBytes(documents.reduce((s, d) => s + d.size, 0)) },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xl font-bold">{value}</p>
                <p className="text-xs text-text-muted mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            {EXPORTS.map(({ key, Icon, title, desc, count, disabled, action, format }) => (
              <div key={key} className="glass rounded-xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-semibold">{title}</h2>
                    <span className="text-[10px] font-mono bg-bg-secondary border border-border rounded px-1.5 py-0.5 text-text-muted">{format}</span>
                  </div>
                  <p className="text-sm text-text-secondary mb-2">{desc}</p>
                  <p className="text-xs text-text-muted">{count}</p>
                </div>
                <button
                  onClick={() => doExport(key, action)}
                  disabled={disabled || exporting === key}
                  className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40 active:scale-95 shrink-0"
                >
                  {exporting === key ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : exported === key ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {exported === key ? 'Done!' : 'Export'}
                </button>
              </div>
            ))}
          </div>

          <div className="glass rounded-xl p-4 text-sm text-text-muted">
            <p className="font-medium text-text-secondary mb-1">About your data</p>
            <p>Exports contain metadata only. Embedded vectors and document text are stored in your database and are not included in these files. To migrate your database, use your database provider's native export tools.</p>
          </div>
        </div>
      </div>
    </AuthGate>
  );
}
