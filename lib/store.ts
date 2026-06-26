/**
 * Unified data store — uses Postgres+pgvector when DATABASE_URL is set,
 * otherwise falls back to local JSON files (dev / demo mode).
 */

import { Collection, Chunk, DocumentMeta, User } from '@/lib/types';

const USE_PG = Boolean(process.env.DATABASE_URL);

/* ─── Lazy load the right adapter ─────────────────────────────────────────── */
async function adapter() {
  if (USE_PG) {
    return import('@/lib/db-postgres');
  }
  return import('@/lib/db-json');
}

/* ─── Public API ─────────────────────────────────────────────────────────── */

export async function getUser(id: string): Promise<User | null> {
  return (await adapter()).getUser(id);
}
export async function getUserByEmail(email: string): Promise<User | null> {
  return (await adapter()).getUserByEmail(email);
}
export async function saveUser(user: User): Promise<void> {
  return (await adapter()).saveUser(user);
}
export async function updateUser(id: string, patch: Partial<User>): Promise<void> {
  return (await adapter()).updateUser(id, patch);
}

export async function getCollections(userId: string): Promise<Collection[]> {
  return (await adapter()).getCollections(userId);
}
export async function getCollection(id: string): Promise<Collection | null> {
  return (await adapter()).getCollection(id);
}
export async function saveCollection(col: Collection): Promise<void> {
  return (await adapter()).saveCollection(col);
}
export async function updateCollection(id: string, patch: Partial<Collection>): Promise<void> {
  return (await adapter()).updateCollection(id, patch);
}
export async function deleteCollection(id: string): Promise<void> {
  return (await adapter()).deleteCollection(id);
}

export async function getDocuments(userId: string, collectionId?: string): Promise<DocumentMeta[]> {
  return (await adapter()).getDocuments(userId, collectionId);
}
export async function getDocument(id: string): Promise<DocumentMeta | null> {
  return (await adapter()).getDocument(id);
}
export async function saveDocument(doc: DocumentMeta): Promise<void> {
  return (await adapter()).saveDocument(doc);
}
export async function deleteDocument(id: string): Promise<void> {
  return (await adapter()).deleteDocument(id);
}

export async function addChunks(chunks: Chunk[]): Promise<void> {
  return (await adapter()).addChunks(chunks);
}
export async function deleteChunks(documentId: string): Promise<void> {
  return (await adapter()).deleteChunks(documentId);
}

export async function search(
  queryEmbedding: number[],
  opts: { userId: string; collectionId?: string; topK?: number },
) {
  return (await adapter()).search(queryEmbedding, opts);
}
