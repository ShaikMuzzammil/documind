// Aggregates workspace-wide statistics from existing collections/documents
// data. No additional storage methods are required - this is pure
// computation over data already returned by the storage adapter.

import { Collection, DocumentMeta } from './types';

export interface CollectionSummary {
  id: string;
  name: string;
  documents: number;
  ready: number;
  chunks: number;
  bytes: number;
}

export interface FileTypeSummary {
  type: string;
  count: number;
}

export interface MonthlyUpload {
  label: string;
  count: number;
}

export interface WorkspaceStats {
  totals: {
    documents: number;
    readyDocuments: number;
    collections: number;
    chunks: number;
    bytes: number;
  };
  collections: CollectionSummary[];
  fileTypes: FileTypeSummary[];
  monthly: MonthlyUpload[];
  recentDocuments: DocumentMeta[];
}

function extensionOf(name: string): string {
  const idx = name.lastIndexOf('.');
  if (idx === -1) return 'other';
  return name.slice(idx + 1).toLowerCase() || 'other';
}

export function buildWorkspaceStats(collections: Collection[], documents: DocumentMeta[]): WorkspaceStats {
  const collectionMap = new Map(collections.map((c) => [c.id, c.name]));

  const perCollection = new Map<string, CollectionSummary>();
  for (const c of collections) {
    perCollection.set(c.id, { id: c.id, name: c.name, documents: 0, ready: 0, chunks: 0, bytes: 0 });
  }

  const fileTypeMap = new Map<string, number>();
  const monthMap = new Map<string, number>();
  let totalBytes = 0;
  let totalChunks = 0;
  let readyCount = 0;

  for (const doc of documents) {
    totalBytes += doc.size;
    totalChunks += doc.chunkCount;
    if (doc.status === 'ready') readyCount++;

    const ext = extensionOf(doc.name);
    fileTypeMap.set(ext, (fileTypeMap.get(ext) || 0) + 1);

    const monthKey = new Date(doc.createdAt).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1);

    let bucket = perCollection.get(doc.collectionId);
    if (!bucket) {
      bucket = {
        id: doc.collectionId,
        name: collectionMap.get(doc.collectionId) || 'Unfiled',
        documents: 0,
        ready: 0,
        chunks: 0,
        bytes: 0,
      };
      perCollection.set(doc.collectionId, bucket);
    }
    bucket.documents += 1;
    bucket.bytes += doc.size;
    bucket.chunks += doc.chunkCount;
    if (doc.status === 'ready') bucket.ready += 1;
  }

  const recentDocuments = [...documents]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  return {
    totals: {
      documents: documents.length,
      readyDocuments: readyCount,
      collections: collections.length,
      chunks: totalChunks,
      bytes: totalBytes,
    },
    collections: Array.from(perCollection.values()).sort((a, b) => b.documents - a.documents),
    fileTypes: Array.from(fileTypeMap.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count),
    monthly: Array.from(monthMap.entries()).map(([label, count]) => ({ label, count })),
    recentDocuments,
  };
}
