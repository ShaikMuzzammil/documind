import { NextRequest, NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth';
import { getDocuments, getCollections } from '@/lib/store';

export async function GET(req: NextRequest) {
  const user = await requireCurrentUser(req).catch(() => null);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [documents, collections] = await Promise.all([
    getDocuments(user.id),
    getCollections(user.id),
  ]);

  const report = collections.map((col) => {
    const docs = documents.filter((d) => d.collectionId === col.id);
    return {
      id: col.id,
      name: col.name,
      description: col.description || '',
      createdAt: col.createdAt,
      stats: {
        totalDocuments: docs.length,
        readyDocuments: docs.filter((d) => d.status === 'ready').length,
        errorDocuments: docs.filter((d) => d.status === 'error').length,
        totalChunks: docs.reduce((s, d) => s + d.chunkCount, 0),
        totalSizeBytes: docs.reduce((s, d) => s + d.size, 0),
      },
      documents: docs.map((d) => ({
        id: d.id,
        name: d.name,
        type: d.type,
        sizeBytes: d.size,
        chunks: d.chunkCount,
        status: d.status,
        createdAt: d.createdAt,
      })),
    };
  });

  const payload = {
    exportedAt: new Date().toISOString(),
    userEmail: user.email,
    totalCollections: collections.length,
    totalDocuments: documents.length,
    totalChunks: documents.reduce((s, d) => s + d.chunkCount, 0),
    collections: report,
  };

  return NextResponse.json(payload, {
    headers: {
      'Content-Disposition': `attachment; filename="documind-collections-${Date.now()}.json"`,
    },
  });
}
