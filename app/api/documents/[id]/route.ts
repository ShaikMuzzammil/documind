import { NextRequest, NextResponse } from 'next/server';
import { deleteDocument } from '@/lib/store';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await deleteDocument(id);
  return NextResponse.json({ ok: true });
}
