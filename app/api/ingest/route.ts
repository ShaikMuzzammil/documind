import { NextRequest, NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth';
import { chunkText } from '@/lib/chunk';
import { embed } from '@/lib/embeddings';
import { addChunks, saveDocument } from '@/lib/store';
import { Chunk, DocumentMeta } from '@/lib/types';
import { generateId } from '@/lib/utils';

export const runtime   = 'nodejs';
export const maxDuration = 60;

async function extractText(file: File): Promise<string> {
  const name   = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  if (name.endsWith('.pdf')) {
    const pdfParse = (await import('pdf-parse')).default;
    const parsed   = await pdfParse(buffer);
    return parsed.text;
  }
  return buffer.toString('utf-8');
}

export async function POST(req: NextRequest) {
  const user = await requireCurrentUser(req).catch(() => null);
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const form         = await req.formData();
  const file         = form.get('file');
  const collectionId = (form.get('collectionId') ?? '').toString();

  if (!(file instanceof File)) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  if (!collectionId)           return NextResponse.json({ error: 'collectionId is required' }, { status: 400 });

  const docId   = generateId();
  const baseDoc: DocumentMeta = {
    id:           docId,
    userId:       user.id,
    name:         file.name,
    type:         file.type || 'text/plain',
    size:         file.size,
    collectionId,
    chunkCount:   0,
    status:       'processing',
    createdAt:    new Date().toISOString(),
  };

  try {
    await saveDocument(baseDoc);
    const text   = await extractText(file);
    const pieces = chunkText(text);

    if (!pieces.length) {
      await saveDocument({ ...baseDoc, status: 'error', error: 'No extractable text found' });
      return NextResponse.json({ error: 'Could not extract text from this file.' }, { status: 422 });
    }

    const embeddings = await embed(pieces);
    const chunks: Chunk[] = pieces.map((text, i) => ({
      id:           generateId(),
      documentId:   docId,
      userId:       user.id,
      collectionId,
      text,
      embedding:    embeddings[i],
      index:        i,
    }));

    await addChunks(chunks);
    await saveDocument({ ...baseDoc, status: 'ready', chunkCount: chunks.length });

    return NextResponse.json({ document: { id: docId, name: file.name, chunkCount: chunks.length } });
  } catch (err) {
    console.error('[ingest]', err);
    await saveDocument({ ...baseDoc, status: 'error', error: String(err) });
    return NextResponse.json({ error: 'Processing failed. Please try again.' }, { status: 500 });
  }
}
