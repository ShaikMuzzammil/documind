import { NextRequest, NextResponse } from 'next/server';
import { createCollection, getCollections } from '@/lib/store';
import { generateId } from '@/lib/utils';

export async function GET() {
  const collections = await getCollections();
  return NextResponse.json({ collections });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name = (body.name || '').toString().trim();
  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const collection = await createCollection({
    id: generateId(),
    name,
    description: (body.description || '').toString().trim() || undefined,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ collection }, { status: 201 });
}
