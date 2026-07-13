import { NextRequest, NextResponse } from 'next/server';
import { requireCurrentUser } from '@/lib/auth';
import { chunkText } from '@/lib/chunk';
import { embed } from '@/lib/embeddings';
import { addChunks, saveDocument } from '@/lib/store';
import { extractPdfText } from '@/lib/pdf-extract';
import { Chunk, DocumentMeta } from '@/lib/types';
import { generateId } from '@/lib/utils';

export const runtime    = 'nodejs';
export const maxDuration = 60;
export const dynamic     = 'force-dynamic';

const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15 MB

const SUPPORTED_TEXT_EXTENSIONS = [
  '.txt', '.md', '.markdown', '.csv', '.json', '.tsv', '.log',
  '.js', '.ts', '.tsx', '.jsx', '.py', '.java', '.c', '.cpp', '.h',
  '.go', '.rs', '.rb', '.php', '.html', '.css', '.yml', '.yaml', '.xml', '.sql',
];

class IngestError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

async function parsePdf(buffer: Buffer): Promise<string> {
  try {
    const text = await extractPdfText(buffer);
    if (!text.trim()) {
      throw new Error(
        'No text layer found. This PDF may be scanned (image-only). ' +
        'Run OCR first to add a text layer before uploading.',
      );
    }
    return text;
  } catch (err) {
    throw new IngestError(
      `Could not read this PDF (${err instanceof Error ? err.message : 'parsing failed'}). ` +
      `It may be scanned (image-only), encrypted, or corrupted. ` +
      `For scanned PDFs, run OCR first to add a text layer.`,
      422,
    );
  }
}

async function extractText(file: File): Promise<string> {
  const name   = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  if (name.endsWith('.pdf')) return parsePdf(buffer);

  const ext = name.includes('.') ? `.${name.split('.').pop()}` : '';
  if (ext && !SUPPORTED_TEXT_EXTENSIONS.includes(ext)) {
    // Binary sniff — reject obvious binary files
    const sample = buffer.subarray(0, 1000);
    let nullBytes = 0;
    for (const byte of sample) if (byte === 0) nullBytes++;
    if (nullBytes > 0) {
      throw new IngestError(
        `"${file.name}" appears to be a binary file. Upload PDF, text, Markdown, CSV, JSON, or code files.`,
        422,
      );
    }
  }

  return buffer.toString('utf-8');
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireCurrentUser(req).catch(() => null);
    if (!user) {
      return NextResponse.json(
        { error: 'Please sign in to upload documents.' },
        { status: 401 },
      );
    }

    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return NextResponse.json(
        { error: 'The upload could not be read. Try a smaller file or check your connection.' },
        { status: 400 },
      );
    }

    const file         = form.get('file');
    const collectionId = (form.get('collectionId') || '').toString();

    if (!(file instanceof File))
      return NextResponse.json({ error: 'No file was provided.' }, { status: 400 });
    if (!collectionId)
      return NextResponse.json({ error: 'Choose a collection before uploading.' }, { status: 400 });
    if (file.size === 0)
      return NextResponse.json({ error: `"${file.name}" is empty.` }, { status: 422 });
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: `"${file.name}" is too large. The limit is ${Math.floor(MAX_FILE_BYTES / (1024 * 1024))}MB per file.` },
        { status: 413 },
      );
    }

    const docId    = generateId();
    const baseDoc: DocumentMeta = {
      id: docId, userId: user.id, name: file.name,
      type: file.type || 'text/plain', size: file.size,
      collectionId, chunkCount: 0, status: 'processing',
      createdAt: new Date().toISOString(),
    };

    try {
      const text   = await extractText(file);
      const pieces = chunkText(text);

      if (!pieces.length) {
        const errDoc = { ...baseDoc, status: 'error' as const, error: 'No readable text was found in this file.' };
        await saveDocument(errDoc).catch(() => undefined);
        return NextResponse.json({ document: errDoc, error: errDoc.error }, { status: 422 });
      }

      const embeddings = await embed(pieces);
      const chunks: Chunk[] = pieces.map((textPiece, i) => ({
        id: generateId(), userId: user.id, documentId: docId,
        collectionId, index: i, text: textPiece, embedding: embeddings[i],
      }));

      await addChunks(chunks);

      const readyDoc: DocumentMeta = { ...baseDoc, chunkCount: chunks.length, status: 'ready' };
      await saveDocument(readyDoc);

      return NextResponse.json({ document: readyDoc }, { status: 201 });

    } catch (err) {
      const message = err instanceof IngestError
        ? err.message
        : err instanceof Error
          ? `Indexing failed: ${err.message}`
          : 'Indexing failed unexpectedly.';

      const errDoc = { ...baseDoc, status: 'error' as const, error: message };
      await saveDocument(errDoc).catch(() => undefined);
      const status = err instanceof IngestError ? err.status : 500;
      return NextResponse.json({ document: errDoc, error: message }, { status });
    }

  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed unexpectedly. Please try again.' },
      { status: 500 },
    );
  }
}
