import { NextRequest, NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth';
import { getCollection, getDocuments } from '@/lib/store';
import { computeCollectionHealth } from '@/lib/analytics-utils';
import { formatBytes } from '@/lib/utils';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireCurrentUser(req).catch(() => null);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const col     = await getCollection(id);
  if (!col || col.userId !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const allDocs  = await getDocuments(user.id);
  const health   = computeCollectionHealth(col, allDocs);
  const colDocs  = allDocs.filter((d) => d.collectionId === id);

  const typeMap: Record<string, number> = {};
  for (const d of colDocs) {
    const ext = d.name.split('.').pop()?.toLowerCase() ?? 'other';
    typeMap[ext] = (typeMap[ext] ?? 0) + 1;
  }

  return NextResponse.json({
    collection:    { id: col.id, name: col.name, description: col.description, createdAt: col.createdAt },
    health,
    fileTypes:     typeMap,
    avgChunks:     colDocs.length ? Math.round(colDocs.reduce((s, d) => s + d.chunkCount, 0) / colDocs.length) : 0,
    largestDoc:    colDocs.length ? colDocs.reduce((m, d) => d.size > m.size ? d : m) : null,
    newestDoc:     colDocs.length ? colDocs.reduce((m, d) => d.createdAt > m.createdAt ? d : m) : null,
    sizeFormatted: formatBytes(colDocs.reduce((s, d) => s + d.size, 0)),
  });
}
