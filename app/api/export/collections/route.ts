import { NextRequest, NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth';
import { getDocuments, getCollections } from '@/lib/store';
import { formatBytes } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const user = await requireCurrentUser(req).catch(() => null);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [cols, docs] = await Promise.all([getCollections(user.id), getDocuments(user.id)]);

  const report = cols.map((col) => {
    const colDocs = docs.filter((d) => d.collectionId === col.id);
    return {
      id:          col.id,
      name:        col.name,
      description: col.description,
      createdAt:   col.createdAt,
      documents:   colDocs.map((d) => ({
        id:        d.id,
        name:      d.name,
        type:      d.type,
        size:      formatBytes(d.size),
        chunks:    d.chunkCount,
        status:    d.status,
        createdAt: d.createdAt,
      })),
      stats: {
        totalDocuments: colDocs.length,
        totalSize:      formatBytes(colDocs.reduce((s, d) => s + d.size, 0)),
        totalChunks:    colDocs.reduce((s, d) => s + d.chunkCount, 0),
      },
    };
  });

  return new NextResponse(JSON.stringify(report, null, 2), {
    headers: {
      'Content-Type':        'application/json',
      'Content-Disposition': 'attachment; filename="collections.json"',
    },
  });
}
