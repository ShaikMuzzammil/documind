'use client';

import { useEffect, useState } from 'react';
import { Download, FileText, FolderOpen } from 'lucide-react';
import AuthGate from '@/components/app/AuthGate';
import { useCollections } from '@/lib/use-collections';
import { DocumentMeta } from '@/lib/types';

export default function ExportPage() {
  const { collections } = useCollections();
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);

  useEffect(() => {
    fetch('/api/documents').then((r) => r.json()).then((d) => setDocuments(d.documents || [])).catch(() => {});
  }, []);

  const exportDocumentsCSV = () => {
    const header = 'name,status,chunkCount,size,collection,createdAt';
    const collectionMap = new Map(collections.map((c) => [c.id, c.name]));
    const rows = documents.map((d) =>
      [d.name, d.status, d.chunkCount, d.size, collectionMap.get(d.collectionId) || d.collectionId, d.createdAt].join(',')
    );
    const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'documind-documents.csv'; a.click();
  };

  const exportCollectionsJSON = () => {
    const data = collections.map((c) => ({
      ...c,
      documentCount: documents.filter((d) => d.collectionId === c.id).length,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'documind-collections.json'; a.click();
  };

  return (
    <AuthGate>
      <div className="min-h-[calc(100vh-4rem)] px-4 py-6 sm:px-6 lg:px-8 pb-24 lg:pb-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <p className="text-xs font-mono font-bold tracking-widest text-text-muted">WORKSPACE</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Export</h1>
            <p className="mt-1 text-sm text-text-secondary">Download your workspace data in open formats.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="glass rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-5 w-5 text-accent" />
                <h2 className="font-semibold">Documents</h2>
              </div>
              <p className="text-sm text-text-secondary mb-4">Export a CSV of all documents with their status, chunk count, size, and collection.</p>
              <p className="text-xs text-text-muted mb-4">{documents.length} documents total</p>
              <button
                onClick={exportDocumentsCSV}
                disabled={documents.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                <Download className="h-4 w-4" /> Export CSV
              </button>
            </div>

            <div className="glass rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <FolderOpen className="h-5 w-5 text-accent" />
                <h2 className="font-semibold">Collections</h2>
              </div>
              <p className="text-sm text-text-secondary mb-4">Export a JSON file with all collection names, descriptions, and document counts.</p>
              <p className="text-xs text-text-muted mb-4">{collections.length} collections total</p>
              <button
                onClick={exportCollectionsJSON}
                disabled={collections.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                <Download className="h-4 w-4" /> Export JSON
              </button>
            </div>
          </div>

          <div className="glass rounded-xl p-4 text-sm text-text-muted">
            Exported files contain only document metadata, not the content of your files. Raw document text and embeddings remain in your database.
          </div>
        </div>
      </div>
    </AuthGate>
  );
}
