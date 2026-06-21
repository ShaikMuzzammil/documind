// Simple JSON-file-backed persistence for collections, documents and chunks.
//
// This keeps Phase 1 zero-dependency (no external DB) while exposing a clean
// async API. Phase 2 can swap this module for Postgres + pgvector without
// changing callers.

import { promises as fs } from 'fs';
import path from 'path';
import { Chunk, Citation, Collection, DocumentMeta } from './types';
import { cosineSimilarity } from './embeddings';

const DATA_DIR = path.join(process.cwd(), 'data');
const COLLECTIONS_FILE = path.join(DATA_DIR, 'collections.json');
const DOCUMENTS_FILE = path.join(DATA_DIR, 'documents.json');
const CHUNKS_FILE = path.join(DATA_DIR, 'chunks.json');

async function ensureDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, data: unknown): Promise<void> {
  await ensureDir();
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf-8');
}

// ── Collections ─────────────────────────────────────────────────────
export async function getCollections(): Promise<Collection[]> {
  return readJson<Collection[]>(COLLECTIONS_FILE, []);
}

export async function createCollection(c: Collection): Promise<Collection> {
  const all = await getCollections();
  await writeJson(COLLECTIONS_FILE, [c, ...all]);
  return c;
}

export async function deleteCollection(id: string): Promise<void> {
  const all = (await getCollections()).filter((c) => c.id !== id);
  await writeJson(COLLECTIONS_FILE, all);
  const docs = (await getDocuments()).filter((d) => d.collectionId !== id);
  await writeJson(DOCUMENTS_FILE, docs);
  const chunks = (await getChunks()).filter((ch) => ch.collectionId !== id);
  await writeJson(CHUNKS_FILE, chunks);
}

// ── Documents ─────────────────────────────────────────────────
export async function getDocuments(): Promise<DocumentMeta[]> {
  return readJson<DocumentMeta[]>(DOCUMENTS_FILE, []);
}

export async function saveDocument(doc: DocumentMeta): Promise<void> {
  const all = (await getDocuments()).filter((d) => d.id !== doc.id);
  await writeJson(DOCUMENTS_FILE, [doc, ...all]);
}

export async function deleteDocument(id: string): Promise<void> {
  const docs = (await getDocuments()).filter((d) => d.id !== id);
  await writeJson(DOCUMENTS_FILE, docs);
  const chunks = (await getChunks()).filter((ch) => ch.documentId !== id);
  await writeJson(CHUNKS_FILE, chunks);
}

// ── Chunks + retrieval ────────────────────────────────────────
export async function getChunks(): Promise<Chunk[]> {
  return readJson<Chunk[]>(CHUNKS_FILE, []);
}

export async function addChunks(newChunks: Chunk[]): Promise<void> {
  const all = await getChunks();
  await writeJson(CHUNKS_FILE, [...all, ...newChunks]);
}

/** Vector search: top-k most similar chunks to a query embedding. */
export async function search(
  queryEmbedding: number[],
  opts: { collectionId?: string; topK?: number } = {},
): Promise<Citation[]> {
  const topK = opts.topK ?? 5;
  const docs = await getDocuments();
  const docName = new Map(docs.map((d) => [d.id, d.name]));

  let chunks = await getChunks();
  if (opts.collectionId) {
    chunks = chunks.filter((c) => c.collectionId === opts.collectionId);
  }

  const scored = chunks
    .map((c) => ({ chunk: c, score: cosineSimilarity(queryEmbedding, c.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored.map(({ chunk, score }) => ({
    chunkId: chunk.id,
    documentId: chunk.documentId,
    documentName: docName.get(chunk.documentId) || 'Unknown document',
    index: chunk.index,
    text: chunk.text,
    score,
  }));
}
