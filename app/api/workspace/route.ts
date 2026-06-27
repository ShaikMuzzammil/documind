import { NextRequest, NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth';
import { getDocuments, getCollections } from '@/lib/store';
import { formatBytes, formatRelativeTime } from '@/lib/format';
import { computeCollectionHealth, buildTimeSeriesData } from '@/lib/analytics-utils';

export async function GET(req: NextRequest) {
  const user = await requireCurrentUser(req).catch(() => null);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [docs, cols] = await Promise.all([
    getDocuments(user.id),
    getCollections(user.id),
  ]);

  const totalSize   = docs.reduce((s, d) => s + d.size, 0);
  const totalChunks = docs.reduce((s, d) => s + d.chunkCount, 0);
  const readyDocs   = docs.filter((d) => d.status === 'ready');
  const errorDocs   = docs.filter((d) => d.status === 'error');

  // Collection health scores
  const colHealth = cols.map((c) => computeCollectionHealth(c, docs));

  // Time series last 6 months
  const timeSeries = buildTimeSeriesData(docs, 6);

  // Recent 5 documents
  const recentDocs = docs.slice(0, 5).map((d) => ({
    id:        d.id,
    name:      d.name,
    status:    d.status,
    sizeLabel: formatBytes(d.size),
    timeAgo:   formatRelativeTime(d.createdAt),
    collection:cols.find((c) => c.id === d.collectionId)?.name ?? 'Unknown',
  }));

  // Quick stats
  const healthyCollections = colHealth.filter((c) => c.health === 'healthy').length;
  const degradedCollections = colHealth.filter((c) => c.health === 'degraded').length;

  // Activity events (synthetic from recent docs/collections)
  const activities = [
    ...docs.slice(0, 3).map((d) => ({
      id: d.id, type: 'upload' as const,
      label: `Uploaded "${d.name}"`,
      detail: `${d.chunkCount} chunks · ${formatBytes(d.size)}`,
      timestamp: d.createdAt,
    })),
    ...cols.slice(0, 2).map((c) => ({
      id: c.id, type: 'collection_create' as const,
      label: `Created collection "${c.name}"`,
      timestamp: c.createdAt,
    })),
  ].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 6);

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email },
    overview: {
      totalDocuments:      docs.length,
      totalCollections:    cols.length,
      totalChunks,
      totalSize:           formatBytes(totalSize),
      readyDocuments:      readyDocs.length,
      errorDocuments:      errorDocs.length,
      healthyCollections,
      degradedCollections,
      aiEnabled:           Boolean(process.env.AI_API_KEY),
      dbEnabled:           Boolean(process.env.DATABASE_URL),
    },
    collectionHealth: colHealth,
    timeSeries,
    recentDocuments: recentDocs,
    activities,
  });
}
