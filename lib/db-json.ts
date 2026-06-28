import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { Citation, Chunk, Collection, DocumentMeta, User } from '@/lib/types';
import { cosineSim } from '@/lib/utils';

const DATA_DIR = join(process.cwd(), '.data');

function ensureDir() {
  try { if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true }); } catch { /* read-only FS in prod */ }
}

function readJSON<T>(file: string, def: T): T {
  ensureDir();
  const p = join(DATA_DIR, file);
  if (!existsSync(p)) return def;
  try { return JSON.parse(readFileSync(p, 'utf-8')); } catch { return def; }
}
function writeJSON(file: string, data: unknown) {
  ensureDir();
  try { writeFileSync(join(DATA_DIR, file), JSON.stringify(data, null, 2)); } catch { /* read-only FS */ }
}

/* Users */
export async function getUser(id: string): Promise<User | null> {
  return readJSON<User[]>('users.json', []).find((u) => u.id === id) ?? null;
}
export async function getUserByEmail(email: string): Promise<User | null> {
  return readJSON<User[]>('users.json', []).find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}
export async function saveUser(user: User): Promise<void> {
  const users = readJSON<User[]>('users.json', []);
  const idx = users.findIndex((u) => u.id === user.id);
  if (idx >= 0) users[idx] = user; else users.push(user);
  writeJSON('users.json', users);
}
export async function updateUser(id: string, patch: Partial<User>): Promise<void> {
  const users = readJSON<User[]>('users.json', []);
  const idx = users.findIndex((u) => u.id === id);
  if (idx >= 0) users[idx] = { ...users[idx], ...patch };
  writeJSON('users.json', users);
}

/* Collections */
export async function getCollections(userId: string): Promise<Collection[]> {
  return readJSON<Collection[]>('collections.json', [])
    .filter((c) => c.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export async function getCollection(id: string): Promise<Collection | null> {
  return readJSON<Collection[]>('collections.json', []).find((c) => c.id === id) ?? null;
}
export async function saveCollection(col: Collection): Promise<void> {
  const cols = readJSON<Collection[]>('collections.json', []);
  const idx = cols.findIndex((c) => c.id === col.id);
  if (idx >= 0) cols[idx] = col; else cols.push(col);
  writeJSON('collections.json', cols);
}
export async function updateCollection(id: string, patch: Partial<Collection>): Promise<void> {
  const cols = readJSON<Collection[]>('collections.json', []);
  const idx = cols.findIndex((c) => c.id === id);
  if (idx >= 0) cols[idx] = { ...cols[idx], ...patch, updatedAt: new Date().toISOString() };
  writeJSON('collections.json', cols);
}
export async function deleteCollection(id: string): Promise<void> {
  writeJSON('collections.json', readJSON<Collection[]>('collections.json', []).filter((c) => c.id !== id));
}

/* Documents */
export async function getDocuments(userId: string, collectionId?: string): Promise<DocumentMeta[]> {
  return readJSON<DocumentMeta[]>('documents.json', [])
    .filter((d) => d.userId === userId && (!collectionId || d.collectionId === collectionId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export async function getDocument(id: string): Promise<DocumentMeta | null> {
  return readJSON<DocumentMeta[]>('documents.json', []).find((d) => d.id === id) ?? null;
}
export async function saveDocument(doc: DocumentMeta): Promise<void> {
  const docs = readJSON<DocumentMeta[]>('documents.json', []);
  const idx = docs.findIndex((d) => d.id === doc.id);
  if (idx >= 0) docs[idx] = doc; else docs.push(doc);
  writeJSON('documents.json', docs);
}
export async function deleteDocument(id: string): Promise<void> {
  writeJSON('documents.json', readJSON<DocumentMeta[]>('documents.json', []).filter((d) => d.id !== id));
}

/* Chunks */
export async function addChunks(chunks: Chunk[]): Promise<void> {
  writeJSON('chunks.json', [...readJSON<Chunk[]>('chunks.json', []), ...chunks]);
}
export async function deleteChunks(documentId: string): Promise<void> {
  writeJSON('chunks.json', readJSON<Chunk[]>('chunks.json', []).filter((c) => c.documentId !== documentId));
}

/* Vector search */
export async function search(
  queryEmbedding: number[],
  opts: { userId: string; collectionId?: string; topK?: number },
): Promise<Citation[]> {
  const chunks = readJSON<Chunk[]>('chunks.json', []).filter(
    (c) => c.userId === opts.userId && (!opts.collectionId || c.collectionId === opts.collectionId),
  );
  const docs  = readJSON<DocumentMeta[]>('documents.json', []);
  const topK  = opts.topK ?? 5;
  const scored = chunks
    .map((c) => ({ c, score: cosineSim(queryEmbedding, c.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored.map(({ c, score }) => ({
    chunkId:      c.id,
    documentId:   c.documentId,
    documentName: docs.find((d) => d.id === c.documentId)?.name ?? 'Unknown',
    text:         c.text,
    score,
    index:        c.index,
  }));
}
