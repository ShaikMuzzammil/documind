import { NextRequest, NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth';
import { deleteCollection, updateCollection } from '@/lib/store';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await requireCurrentUser(_req).catch(() => null);
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  await deleteCollection(user.id, id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await requireCurrentUser(req).catch(() => null);
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const patch: Record<string, string> = {};
  if (typeof body.name === 'string' && body.name.trim()) patch.name = body.name.trim();
  if (typeof body.description === 'string') patch.description = body.description.trim();

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const updated = await updateCollection(user.id, id, patch);
  if (!updated) return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
  return NextResponse.json({ collection: updated });
}
