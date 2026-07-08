import { NextRequest, NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth';
import { getChunks, getDocuments } from '@/lib/store';
import { DocumentMeta } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireCurrentUser(req).catch(() => null);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const docs = await getDocuments(user.id);
  const doc: DocumentMeta | undefined = docs.find((d: DocumentMeta) => d.id === id);
  if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

  try {
    const chunks = await getChunks(user.id, id);
    const text = chunks.map((c: { text: string }) => c.text).join('\n\n---\n\n');
    return NextResponse.json({
      document: doc,
      chunkCount: chunks.length,
      preview: text.slice(0, 8000),
      chunks: chunks.slice(0, 20).map((c: { index: number; text: string }) => ({ index: c.index, text: c.text })),
    });
  } catch {
    return NextResponse.json({ error: 'Could not load preview' }, { status: 500 });
  }
}
