import { NextRequest, NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth';
import { getDocument, deleteDocument, deleteChunks } from '@/lib/store';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireCurrentUser(req).catch(() => null);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const doc = await getDocument(id);
  if (!doc || doc.userId !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await deleteChunks(id);
  await deleteDocument(id);
  return NextResponse.json({ success: true });
}
