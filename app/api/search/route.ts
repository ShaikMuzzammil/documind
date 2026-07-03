import { NextRequest, NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth';
import { embedOne } from '@/lib/embeddings';
import { search } from '@/lib/store';

export async function POST(req: NextRequest) {
  const user = await requireCurrentUser(req).catch(() => null);
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const query = (body.query || '').toString().trim();
  const collectionId = body.collectionId ? body.collectionId.toString() : undefined;

  if (!query) return NextResponse.json({ results: [] });

  try {
    const queryEmbedding = await embedOne(query);
    const results = await search(queryEmbedding, { userId: user.id, collectionId, topK: 20 });
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: 'Search failed. Please try again.', results: [] }, { status: 500 });
  }
}
