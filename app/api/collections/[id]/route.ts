import { NextRequest, NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth';
import { getCollection, updateCollection, deleteCollection } from '@/lib/store';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireCurrentUser(req).catch(() => null);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const col = await getCollection(id);
  if (!col || col.userId !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  await updateCollection(id, {
    name:        body.name        ? body.name.toString().trim()        : col.name,
    description: body.description !== undefined ? body.description.toString().trim() : col.description,
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireCurrentUser(req).catch(() => null);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const col = await getCollection(id);
  if (!col || col.userId !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await deleteCollection(id);
  return NextResponse.json({ success: true });
}
