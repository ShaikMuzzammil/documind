import { NextRequest, NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth';
import { getDocuments, getCollections } from '@/lib/store';
import { formatBytes } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const user = await requireCurrentUser(req).catch(() => null);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [docs, cols] = await Promise.all([
    getDocuments(user.id),
    getCollections(user.id),
  ]);

  const totalSize   = docs.reduce((s, d) => s + d.size, 0);
  const totalChunks = docs.reduce((s, d) => s + d.chunkCount, 0);
  const ready       = docs.filter((d) => d.status === 'ready').length;
  const errors      = docs.filter((d) => d.status === 'error').length;

  // File type distribution
  const typeMap: Record<string, number> = {};
  for (const d of docs) {
    const ext = d.name.split('.').pop()?.toLowerCase() ?? 'other';
    typeMap[ext] = (typeMap[ext] ?? 0) + 1;
  }

  // Activity by month (last 6 months)
  const monthActivity: Record<string, number> = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthActivity[key] = 0;
  }
  for (const d of docs) {
    const key = d.createdAt.slice(0, 7);
    if (key in monthActivity) monthActivity[key]++;
  }

  // Collection leaderboard (by doc count)
  const colLeaderboard = cols
    .map((c) => ({
      id:       c.id,
      name:     c.name,
      docCount: docs.filter((d) => d.collectionId === c.id).length,
      size:     formatBytes(docs.filter((d) => d.collectionId === c.id).reduce((s, d) => s + d.size, 0)),
    }))
    .sort((a, b) => b.docCount - a.docCount)
    .slice(0, 5);

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, memberSince: user.createdAt },
    stats: {
      totalDocuments:   docs.length,
      totalCollections: cols.length,
      totalChunks,
      totalSize:        formatBytes(totalSize),
      totalSizeBytes:   totalSize,
      readyDocuments:   ready,
      errorDocuments:   errors,
      avgChunksPerDoc:  docs.length ? Math.round(totalChunks / docs.length) : 0,
    },
    typeDistribution: typeMap,
    monthlyActivity:  monthActivity,
    topCollections:   colLeaderboard,
    capabilities: {
      aiEnabled: Boolean(process.env.AI_API_KEY),
      dbEnabled: Boolean(process.env.DATABASE_URL),
    },
  });
}
