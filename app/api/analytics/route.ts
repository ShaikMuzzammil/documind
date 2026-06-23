import { NextRequest, NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth';
import { getDocuments, getCollections } from '@/lib/store';
import { usingPostgres } from '@/lib/storage';

export async function GET(req: NextRequest) {
  const user = await requireCurrentUser(req).catch(() => null);
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const [documents, collections] = await Promise.all([
    getDocuments(user.id),
    getCollections(user.id),
  ]);

  // Per-collection aggregates
  const colMap = new Map(
    collections.map((c) => [c.id, { id: c.id, name: c.name, docs: 0, chunks: 0, size: 0, ready: 0, error: 0 }]),
  );
  for (const doc of documents) {
    const col = colMap.get(doc.collectionId);
    if (!col) continue;
    col.docs += 1;
    col.chunks += doc.chunkCount;
    col.size += doc.size;
    if (doc.status === 'ready') col.ready += 1;
    if (doc.status === 'error') col.error += 1;
  }

  // File-type breakdown
  const typeMap: Record<string, number> = {};
  for (const doc of documents) {
    const raw = doc.name.includes('.') ? doc.name.split('.').pop()!.toLowerCase() : 'other';
    const ext = raw.length <= 6 ? `.${raw}` : 'other';
    typeMap[ext] = (typeMap[ext] || 0) + 1;
  }
  const typeBreakdown = Object.entries(typeMap)
    .map(([ext, count]) => ({ ext, count }))
    .sort((a, b) => b.count - a.count);

  // Status breakdown
  const statusMap: Record<string, number> = { ready: 0, processing: 0, error: 0 };
  for (const doc of documents) statusMap[doc.status] = (statusMap[doc.status] || 0) + 1;

  // Recent 8 documents
  const recent = [...documents]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  return NextResponse.json({
    overview: {
      totalDocs: documents.length,
      readyDocs: statusMap.ready || 0,
      processingDocs: statusMap.processing || 0,
      errorDocs: statusMap.error || 0,
      totalChunks: documents.reduce((s, d) => s + d.chunkCount, 0),
      totalSizeBytes: documents.reduce((s, d) => s + d.size, 0),
      totalCollections: collections.length,
      storageMode: usingPostgres() ? 'postgres' : 'local',
      aiEnabled: Boolean(process.env.GEMINI_API_KEY),
    },
    collectionStats: Array.from(colMap.values()),
    typeBreakdown,
    statusBreakdown: Object.entries(statusMap).map(([status, count]) => ({ status, count })),
    recent,
  });
}
