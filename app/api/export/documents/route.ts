import { NextRequest } from 'next/server';
import { requireCurrentUser } from '@/lib/auth';
import { getDocuments, getCollections } from '@/lib/store';
import { formatBytes } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const user = await requireCurrentUser(req).catch(() => null);
  if (!user) return new Response('Unauthorized', { status: 401 });

  const [documents, collections] = await Promise.all([
    getDocuments(user.id),
    getCollections(user.id),
  ]);

  const colNames = new Map(collections.map((c) => [c.id, c.name]));

  const rows: string[] = [
    ['name', 'collection', 'file_type', 'size_bytes', 'size_human', 'chunks', 'status', 'created_at'].join(','),
  ];

  for (const doc of documents) {
    rows.push([
      `"${doc.name.replace(/"/g, '""')}"`,
      `"${(colNames.get(doc.collectionId) || 'Unknown').replace(/"/g, '""')}"`,
      `"${doc.type || 'unknown'}"`,
      doc.size,
      `"${formatBytes(doc.size)}"`,
      doc.chunkCount,
      doc.status,
      doc.createdAt,
    ].join(','));
  }

  const csv = rows.join('\n');
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="documind-documents-${Date.now()}.csv"`,
    },
  });
}
