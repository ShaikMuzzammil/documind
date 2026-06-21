import { NextRequest, NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth';
import { createCollection, getCollections } from '@/lib/store';
import { generateId } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const user = await requireCurrentUser(req).catch(() => null);
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const collections = await getCollections(user.id);
  return NextResponse.json({ collections });
}

export async function POST(req: NextRequest) {
  const user = await requireCurrentUser(req).catch(() => null);
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const name = (body.name || '').toString().trim();
  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const collection = await createCollection({
    id: generateId(),
    userId: user.id,
    name,
    description: (body.description || '').toString().trim() || undefined,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ collection }, { status: 201 });
}
