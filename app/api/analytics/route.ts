import { NextRequest, NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth';
import { getCollections, getDocuments } from '@/lib/store';
import { formatBytes } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const user = await requireCurrentUser(req).catch(() => null);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [collections, docs] = await Promise.all([
    getCollections(user.id),
    getDocuments(user.id),
  ]);

  const totalSize    = docs.reduce((s, d) => s + d.size, 0);
  const totalChunks  = docs.reduce((s, d) => s + d.chunkCount, 0);
  const readyDocs    = docs.filter((d) => d.status === 'ready');
  const errorDocs    = docs.filter((d) => d.status === 'error');
  const processDocs  = docs.filter((d) => d.status === 'processing');

  // File type breakdown
  const typeMap: Record<string, number> = {};
  for (const d of docs) {
    const ext = d.name.split('.').pop()?.toLowerCase() ?? 'other';
    typeMap[ext] = (typeMap[ext] ?? 0) + 1;
  }
  const typeBreakdown = Object.entries(typeMap)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({ type, count }));

  // Per-collection stats
  const colStats = collections.map((col) => {
    const colDocs   = docs.filter((d) => d.collectionId === col.id);
    const colSize   = colDocs.reduce((s, d) => s + d.size, 0);
    const colChunks = colDocs.reduce((s, d) => s + d.chunkCount, 0);
    return {
      id:         col.id,
      name:       col.name,
      docCount:   colDocs.length,
      chunkCount: colChunks,
      sizeBytes:  colSize,
      sizeLabel:  formatBytes(colSize),
    };
  });

  // Recent 10 docs
  const recent = docs.slice(0, 10).map((d) => ({
    id:         d.id,
    name:       d.name,
    status:     d.status,
    chunkCount: d.chunkCount,
    sizeLabel:  formatBytes(d.size),
    createdAt:  d.createdAt,
    collection: collections.find((c) => c.id === d.collectionId)?.name ?? 'Unknown',
  }));

  return NextResponse.json({
    summary: {
      totalDocuments:   docs.length,
      totalCollections: collections.length,
      totalChunks,
      totalSize:        formatBytes(totalSize),
      totalSizeBytes:   totalSize,
      readyCount:       readyDocs.length,
      errorCount:       errorDocs.length,
      processingCount:  processDocs.length,
      aiConnected:      Boolean(process.env.AI_API_KEY),
      dbConnected:      Boolean(process.env.DATABASE_URL),
    },
    typeBreakdown,
    collectionStats: colStats,
    recentDocuments: recent,
  });
}
