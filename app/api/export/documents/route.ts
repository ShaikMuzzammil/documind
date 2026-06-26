import { NextRequest, NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth';
import { getDocuments, getCollections } from '@/lib/store';
import { formatBytes } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const user = await requireCurrentUser(req).catch(() => null);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [docs, cols] = await Promise.all([getDocuments(user.id), getCollections(user.id)]);
  const colMap       = Object.fromEntries(cols.map((c) => [c.id, c.name]));

  const rows = [
    ['id', 'name', 'collection', 'type', 'size', 'chunks', 'status', 'created'],
    ...docs.map((d) => [
      d.id, d.name, colMap[d.collectionId] ?? '', d.type,
      formatBytes(d.size), d.chunkCount, d.status, d.createdAt,
    ]),
  ];
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type':        'text/csv',
      'Content-Disposition': 'attachment; filename="documents.csv"',
    },
  });
}
