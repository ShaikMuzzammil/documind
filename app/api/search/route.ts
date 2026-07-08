export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth';
import { embedOne } from '@/lib/embeddings';
import { search } from '@/lib/store';

async function handleSearch(user: { id: string }, query: string, collectionId?: string, topK = 8) {
  if (!query) return NextResponse.json({ results: [] });
  const queryEmbedding = await embedOne(query);
  const results = await search(queryEmbedding, { userId: user.id, collectionId, topK });
  return NextResponse.json({ results });
}

export async function GET(req: NextRequest) {
  const user = await requireCurrentUser(req).catch(() => null);
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get('query') || '').trim();
  const collectionId = searchParams.get('collectionId') || undefined;
  const topK = Number(searchParams.get('topK') || '8');
  try {
    return await handleSearch(user, query, collectionId, topK);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Search failed', results: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await requireCurrentUser(req).catch(() => null);
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const query = (body.query || '').toString().trim();
  const collectionId = body.collectionId ? body.collectionId.toString() : undefined;
  const topK = Number(body.topK || 8);
  try {
    return await handleSearch(user, query, collectionId, topK);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Search failed', results: [] }, { status: 500 });
  }
}
