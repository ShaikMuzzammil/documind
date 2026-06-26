import { NextRequest, NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth';
import { getCollection, getDocuments } from '@/lib/store';
import { formatBytes } from '@/lib/utils';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireCurrentUser(req).catch(() => null);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const col = await getCollection(id);
  if (!col || col.userId !== user.id) {
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
  }

  const docs = await getDocuments(user.id, id);
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const filtered = status ? docs.filter((d) => d.status === status) : docs;

  return NextResponse.json({
    collection: {
      id:       col.id,
      name:     col.name,
      description: col.description,
    },
    documents: filtered.map((d) => ({
      id:         d.id,
      name:       d.name,
      type:       d.type,
      size:       d.size,
      sizeFmt:    formatBytes(d.size),
      chunkCount: d.chunkCount,
      status:     d.status,
      error:      d.error,
      createdAt:  d.createdAt,
    })),
    stats: {
      total:      docs.length,
      ready:      docs.filter((d) => d.status === 'ready').length,
      error:      docs.filter((d) => d.status === 'error').length,
      processing: docs.filter((d) => d.status === 'processing').length,
      totalSize:  formatBytes(docs.reduce((s, d) => s + d.size, 0)),
      totalChunks:docs.reduce((s, d) => s + d.chunkCount, 0),
    },
  });
}
