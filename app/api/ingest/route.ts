import { NextRequest, NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth';
import { chunkText } from '@/lib/chunk';
import { embed } from '@/lib/embeddings';
import { addChunks, saveDocument } from '@/lib/store';
import { Chunk, DocumentMeta } from '@/lib/types';
import { generateId } from '@/lib/utils';

export const runtime = 'nodejs';
export const maxDuration = 60;

async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  if (name.endsWith('.pdf')) {
    // Lazy import keeps the heavy parser out of the edge bundle.
    const pdfParse = (await import('pdf-parse')).default;
    const parsed = await pdfParse(buffer);
    return parsed.text;
  }

  // txt, md, csv, json, code, etc.
  return buffer.toString('utf-8');
}

export async function POST(req: NextRequest) {
  const user = await requireCurrentUser(req).catch(() => null);
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  const form = await req.formData();
  const file = form.get('file');
  const collectionId = (form.get('collectionId') || '').toString();

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }
  if (!collectionId) {
    return NextResponse.json({ error: 'collectionId is required' }, { status: 400 });
  }

  const docId = generateId();
  const baseDoc: DocumentMeta = {
    id: docId,
    userId: user.id,
    name: file.name,
    type: file.type || 'text/plain',
    size: file.size,
    collectionId,
    chunkCount: 0,
    status: 'processing',
    createdAt: new Date().toISOString(),
  };

  try {
    const text = await extractText(file);
    const pieces = chunkText(text);

    if (!pieces.length) {
      const errDoc = { ...baseDoc, status: 'error' as const, error: 'No extractable text' };
      await saveDocument(errDoc);
      return NextResponse.json({ document: errDoc }, { status: 422 });
    }

    const embeddings = await embed(pieces);
    const chunks: Chunk[] = pieces.map((textPiece, i) => ({
      id: generateId(),
      userId: user.id,
      documentId: docId,
      collectionId,
      index: i,
      text: textPiece,
      embedding: embeddings[i],
    }));

    await addChunks(chunks);

    const readyDoc: DocumentMeta = {
      ...baseDoc,
      chunkCount: chunks.length,
      status: 'ready',
    };
    await saveDocument(readyDoc);

    return NextResponse.json({ document: readyDoc }, { status: 201 });
  } catch (err) {
    const errDoc = {
      ...baseDoc,
      status: 'error' as const,
      error: err instanceof Error ? err.message : 'Ingestion failed',
    };
    await saveDocument(errDoc);
    return NextResponse.json({ document: errDoc, error: errDoc.error }, { status: 500 });
  }
}
