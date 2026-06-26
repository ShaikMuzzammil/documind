import { NextRequest, NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth';
import { getDocument } from '@/lib/store';

// Read chunks directly from the JSON store or postgres
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireCurrentUser(req).catch(() => null);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const doc = await getDocument(id);
  if (!doc || doc.userId !== user.id) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  // Dynamically read chunks from the right adapter
  const USE_PG = Boolean(process.env.DATABASE_URL);

  if (USE_PG) {
    const { Pool } = await import('pg');
    const ssl = process.env.DATABASE_SSL !== 'false' ? { rejectUnauthorized: false } : undefined;
    const pool = new Pool({ connectionString: process.env.DATABASE_URL!, ssl });
    const r = await pool.query(
      'SELECT id, idx, text FROM dm_chunks WHERE document_id=$1 ORDER BY idx ASC',
      [id],
    );
    await pool.end();
    return NextResponse.json({
      document: { id: doc.id, name: doc.name, chunkCount: doc.chunkCount },
      chunks:   r.rows.map((c) => ({ id: c.id, index: c.idx, text: c.text, length: c.text.length })),
    });
  }

  // JSON store fallback
  const { readFileSync, existsSync } = await import('fs');
  const { join } = await import('path');
  const chunksPath = join(process.cwd(), '.data', 'chunks.json');
  if (!existsSync(chunksPath)) {
    return NextResponse.json({ document: { id: doc.id, name: doc.name }, chunks: [] });
  }
  const allChunks = JSON.parse(readFileSync(chunksPath, 'utf-8'));
  const docChunks = allChunks
    .filter((c: { documentId: string }) => c.documentId === id)
    .sort((a: { index: number }, b: { index: number }) => a.index - b.index)
    .map((c: { id: string; index: number; text: string }) => ({
      id:     c.id,
      index:  c.index,
      text:   c.text,
      length: c.text.length,
    }));

  return NextResponse.json({
    document: { id: doc.id, name: doc.name, chunkCount: doc.chunkCount },
    chunks:   docChunks,
  });
}
