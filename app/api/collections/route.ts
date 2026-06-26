import { NextRequest, NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth';
import { getCollections, saveCollection } from '@/lib/store';
import { generateId } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const user = await requireCurrentUser(req).catch(() => null);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const cols = await getCollections(user.id);
  return NextResponse.json({ collections: cols });
}

export async function POST(req: NextRequest) {
  const user = await requireCurrentUser(req).catch(() => null);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const name = (body.name ?? '').toString().trim();
  if (!name) return NextResponse.json({ error: 'Collection name is required.' }, { status: 400 });

  const col = {
    id:          generateId(),
    userId:      user.id,
    name,
    description: (body.description ?? '').toString().trim() || undefined,
    createdAt:   new Date().toISOString(),
    updatedAt:   new Date().toISOString(),
  };
  await saveCollection(col);
  return NextResponse.json({ collection: col }, { status: 201 });
}
