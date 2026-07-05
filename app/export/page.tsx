'use client';

import { useEffect, useState } from 'react';
import {
  Download, FileText, FolderOpen, Code, Table, CheckCircle2,
  Loader2, FileJson, FileDown, Layers, BarChart3,
} from 'lucide-react';
import AuthGate from '@/components/app/AuthGate';
import { useCollections } from '@/lib/use-collections';
import { DocumentMeta } from '@/lib/types';
import { formatBytes } from '@/lib/utils';

export default function ExportPage() {
  const { collections } = useCollections();
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [exporting, setExporting] = useState<string | null>(null);
  const [exported, setExported] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/documents')
      .then(r => r.json())
      .then(d => { setDocuments(d.documents || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const doExport = async (key: string, fn: () => void) => {
    setExporting(key);
    await new Promise(r => setTimeout(r, 400));
    fn();
    setExporting(null);
    setExported(key);
    setTimeout(() => setExported(null), 3000);
  };

  const download = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportDocumentsCSV = () => {
    const header = 'name,type,status,chunkCount,size,collection,createdAt';
    const collectionMap = new Map(collections.map(c => [c.id, c.name]));
    const rows = documents.map(d =>
      [`"${d.name.replace(/"/g, '""')}"`, d.type, d.status, d.chunkCount, d.size, `"${collectionMap.get(d.collectionId) || ''}"`, d.createdAt].join(',')
    );
    download(header + '\n' + rows.join('\n'), 'documind-documents.csv', 'text/csv');
  };

  const exportCollectionsJSON = () => {
    const data = collections.map(c => ({
      ...c,
      documentCount: documents.filter(d => d.collectionId === c.id).length,
      readyDocuments: documents.filter(d => d.collectionId === c.id && d.status === 'ready').length,
      totalChunks: documents.filter(d => d.collectionId === c.id).reduce((s, d) => s + d.chunkCount, 0),
      totalSizeBytes: documents.filter(d => d.collectionId === c.id).reduce((s, d) => s + d.size, 0),
    }));
    download(JSON.stringify(data, null, 2), 'documind-collections.json', 'application/json');
  };

  const exportDocumentsJSON = () => {
    const collectionMap = new Map(collections.map(c => [c.id, c.name]));
    const data = documents.map(d => ({
      ...d,
      collectionName: collectionMap.get(d.collectionId) || 'Unknown',
    }));
    download(JSON.stringify(data, null, 2), 'documind-documents.json', 'application/json');
  };

  const exportWorkspaceMarkdown = () => {
    const collectionMap = new Map(collections.map(c => [c.id, c.name]));
    const readyDocs = documents.filter(d => d.status === 'ready');
    const lines = [
      '# DocuMind Workspace Export',
      `*Exported: ${new Date().toLocaleString()}*`,
      '',
      '## Summary',
      `| Metric | Value |`,
      `|--------|-------|`,
      `| Collections | ${collections.length} |`,
      `| Total Documents | ${documents.length} |`,
      `| Ready Documents | ${readyDocs.length} |`,
      `| Total Chunks | ${documents.reduce((s, d) => s + d.chunkCount, 0)} |`,
      `| Total Size | ${formatBytes(documents.reduce((s, d) => s + d.size, 0))} |`,
      '',
      '## Collections',
      ...collections.map(c => {
        const docs = documents.filter(d => d.collectionId === c.id);
        const ready = docs.filter(d => d.status === 'ready');
        return [
          ``,
          `### ${c.name}`,
          c.description ? `*${c.description}*` : '',
          `- Documents: ${docs.length} (${ready.length} ready)`,
          `- Chunks: ${docs.reduce((s, d) => s + d.chunkCount, 0)}`,
          ``,
          '| Document | Status | Chunks | Size |',
          '|----------|--------|--------|------|',
          ...docs.map(d => `| ${d.name} | ${d.status} | ${d.chunkCount} | ${formatBytes(d.size)} |`),
        ].filter(Boolean).join('\n');
      }),
    ];
    download(lines.join('\n'), 'documind-workspace.md', 'text/markdown');
  };

  const exportStatsJSON = () => {
    const collectionMap = new Map(collections.map(c => [c.id, c.name]));
    const stats = {
      exportedAt: new Date().toISOString(),
      totals: {
        collections: collections.length,
        documents: documents.length,
        readyDocuments: documents.filter(d => d.status === 'ready').length,
        chunks: documents.reduce((s, d) => s + d.chunkCount, 0),
        bytes: documents.reduce((s, d) => s + d.size, 0),
      },
      byCollection: collections.map(c => {
        const docs = documents.filter(d => d.collectionId === c.id);
        return {
          id: c.id,
          name: c.name,
          documents: docs.length,
          readyDocuments: docs.filter(d => d.status === 'ready').length,
          chunks: docs.reduce((s, d) => s + d.chunkCount, 0),
          bytes: docs.reduce((s, d) => s + d.size, 0),
        };
      }),
      byFileType: Object.entries(
        documents.reduce((acc, d) => {
          const ext = d.name.split('.').pop()?.toLowerCase() || 'unknown';
          acc[ext] = (acc[ext] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).map(([type, count]) => ({ type, count })),
      recentDocuments: documents
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)
        .map(d => ({ ...d, collectionName: collectionMap.get(d.collectionId) || 'Unknown' })),
    };
    download(JSON.stringify(stats, null, 2), 'documind-stats.json', 'application/json');
  };

  const EXPORTS = [
    {
      key: 'docs-csv',
      Icon: Table,
      color: 'text-green-400',
      bg: 'bg-green-400/10',
      title: 'Documents — CSV',
      desc: 'All documents with status, chunk count, file size, and collection. Opens in Excel or Google Sheets.',
      count: `${documents.length} documents`,
      disabled: documents.length === 0,
      action: exportDocumentsCSV,
      format: '.csv',
    },
    {
      key: 'docs-json',
      Icon: FileJson,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      title: 'Documents — JSON',
      desc: 'Full document metadata in JSON format. Useful for programmatic processing or backup.',
      count: `${documents.length} documents`,
      disabled: documents.length === 0,
      action: exportDocumentsJSON,
      format: '.json',
    },
    {
      key: 'collections-json',
      Icon: Code,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
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
      color: 'text-cyan-400',
      bg: 'bg-cyan-400/10',
      title: 'Workspace Report — Markdown',
      desc: 'Human-readable report with tables. Opens in any Markdown viewer or Notion.',
      count: `${documents.length} docs across ${collections.length} collections`,
      disabled: documents.length === 0,
      action: exportWorkspaceMarkdown,
      format: '.md',
    },
    {
      key: 'stats-json',
      Icon: BarChart3,
      color: 'text-orange-400',
      bg: 'bg-orange-400/10',
      title: 'Analytics Snapshot — JSON',
      desc: 'Complete stats: totals by collection, file-type breakdown, and 10 most recent documents.',
      count: 'Full workspace snapshot',
      disabled: documents.length === 0 && collections.length === 0,
      action: exportStatsJSON,
      format: '.json',
    },
  ];

  const readyDocs = documents.filter(d => d.status === 'ready').length;

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
          <div className="glass rounded-xl p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              {loading
                ? [...Array(4)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-7 bg-bg-hover rounded mx-auto w-12 mb-1" />
                      <div className="h-3 bg-bg-hover rounded mx-auto w-16" />
                    </div>
                  ))
                : [
                    { label: 'Documents', value: documents.length, Icon: FileDown },
                    { label: 'Ready', value: readyDocs, Icon: CheckCircle2 },
                    { label: 'Collections', value: collections.length, Icon: FolderOpen },
                    { label: 'Total Size', value: formatBytes(documents.reduce((s, d) => s + d.size, 0)), Icon: Layers },
                  ].map(({ label, value, Icon }) => (
                    <div key={label} className="flex flex-col items-center gap-1">
                      <Icon className="h-4 w-4 text-accent mb-1" />
                      <p className="text-xl font-bold">{value}</p>
                      <p className="text-xs text-text-muted">{label}</p>
                    </div>
                  ))
              }
            </div>
          </div>

          <div className="space-y-3">
            {EXPORTS.map(({ key, Icon, color, bg, title, desc, count, disabled, action, format }) => (
              <div key={key} className="glass rounded-xl p-5 flex items-start gap-4 hover:border-accent/20 transition-colors">
                <div className={`w-11 h-11 rounded-xl ${bg} border border-white/10 flex items-center justify-center shrink-0`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-semibold">{title}</h2>
                    <span className="text-[10px] font-mono bg-bg-secondary border border-border rounded px-1.5 py-0.5 text-text-muted">{format}</span>
                  </div>
                  <p className="text-sm text-text-secondary mb-1.5">{desc}</p>
                  <p className="text-xs text-text-muted">{count}</p>
                </div>
                <button
                  onClick={() => doExport(key, action)}
                  disabled={disabled || exporting !== null}
                  className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40 active:scale-95 shrink-0"
                >
                  {exporting === key ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : exported === key ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {exporting === key ? 'Exporting…' : exported === key ? 'Done!' : 'Export'}
                </button>
              </div>
            ))}
          </div>

          <div className="glass rounded-xl p-4 text-sm text-text-muted">
            <p className="font-medium text-text-secondary mb-1">About your data</p>
            <p>Exports contain metadata only. Document text and embedding vectors stay in your database and are not included in these files. To migrate, use your database provider&apos;s native export tools.</p>
          </div>
        </div>
      </div>
    </AuthGate>
  );
}
