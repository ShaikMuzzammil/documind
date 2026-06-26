import { DocumentMeta, Collection } from '@/lib/types';
import { formatBytes } from '@/lib/utils';

export interface CollectionHealth {
  id:          string;
  name:        string;
  docCount:    number;
  readyCount:  number;
  errorCount:  number;
  totalChunks: number;
  totalSize:   number;
  sizeFmt:     string;
  health:      'healthy' | 'degraded' | 'empty';
  healthScore: number; // 0-100
}

export interface WorkspaceSummary {
  totalDocs:       number;
  totalCollections:number;
  totalChunks:     number;
  totalSizeBytes:  number;
  totalSizeFmt:    string;
  readyDocs:       number;
  errorDocs:       number;
  processingDocs:  number;
  avgChunksPerDoc: number;
  largestDoc:      DocumentMeta | null;
  newestDoc:       DocumentMeta | null;
  mostActiveCol:   { id: string; name: string; docCount: number } | null;
}

export function computeCollectionHealth(
  col: Collection,
  docs: DocumentMeta[],
): CollectionHealth {
  const colDocs  = docs.filter((d) => d.collectionId === col.id);
  const ready    = colDocs.filter((d) => d.status === 'ready').length;
  const errors   = colDocs.filter((d) => d.status === 'error').length;
  const chunks   = colDocs.reduce((s, d) => s + d.chunkCount, 0);
  const size     = colDocs.reduce((s, d) => s + d.size, 0);

  let health: CollectionHealth['health'] = 'healthy';
  let score = 100;

  if (colDocs.length === 0) { health = 'empty'; score = 0; }
  else if (errors > ready)  { health = 'degraded'; score = Math.max(10, 100 - (errors / colDocs.length) * 100); }
  else if (errors > 0)      { health = 'degraded'; score = 100 - (errors / colDocs.length) * 50; }

  return {
    id: col.id, name: col.name,
    docCount: colDocs.length, readyCount: ready, errorCount: errors,
    totalChunks: chunks, totalSize: size, sizeFmt: formatBytes(size),
    health, healthScore: Math.round(score),
  };
}

export function computeWorkspaceSummary(
  docs: DocumentMeta[],
  cols: Collection[],
): WorkspaceSummary {
  const totalSize    = docs.reduce((s, d) => s + d.size, 0);
  const totalChunks  = docs.reduce((s, d) => s + d.chunkCount, 0);
  const readyDocs    = docs.filter((d) => d.status === 'ready');
  const errorDocs    = docs.filter((d) => d.status === 'error');
  const processDocs  = docs.filter((d) => d.status === 'processing');
  const largestDoc   = docs.length ? docs.reduce((m, d) => d.size > m.size ? d : m) : null;
  const newestDoc    = docs.length ? docs.reduce((m, d) => d.createdAt > m.createdAt ? d : m) : null;

  const colDocCounts = cols.map((c) => ({
    id:       c.id,
    name:     c.name,
    docCount: docs.filter((d) => d.collectionId === c.id).length,
  }));
  const mostActiveCol = colDocCounts.length
    ? colDocCounts.reduce((m, c) => c.docCount > m.docCount ? c : m)
    : null;

  return {
    totalDocs:        docs.length,
    totalCollections: cols.length,
    totalChunks,
    totalSizeBytes:   totalSize,
    totalSizeFmt:     formatBytes(totalSize),
    readyDocs:        readyDocs.length,
    errorDocs:        errorDocs.length,
    processingDocs:   processDocs.length,
    avgChunksPerDoc:  docs.length ? Math.round(totalChunks / docs.length) : 0,
    largestDoc,
    newestDoc,
    mostActiveCol:    mostActiveCol?.docCount ? mostActiveCol : null,
  };
}

export function buildTimeSeriesData(
  docs: DocumentMeta[],
  months = 6,
): { month: string; docs: number; chunks: number }[] {
  const now    = new Date();
  const result = [];
  for (let i = months - 1; i >= 0; i--) {
    const d     = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key   = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    const mDocs = docs.filter((doc) => doc.createdAt.startsWith(key));
    result.push({
      month:  label,
      docs:   mDocs.length,
      chunks: mDocs.reduce((s, doc) => s + doc.chunkCount, 0),
    });
  }
  return result;
}

export function fileTypeBreakdown(docs: DocumentMeta[]): { type: string; count: number; pct: number }[] {
  const map: Record<string, number> = {};
  for (const d of docs) {
    const ext = d.name.split('.').pop()?.toLowerCase() ?? 'other';
    map[ext] = (map[ext] ?? 0) + 1;
  }
  const total = docs.length || 1;
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({ type, count, pct: Math.round((count / total) * 100) }));
}
