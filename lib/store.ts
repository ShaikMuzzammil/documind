// Thin facade over the selected storage adapter (JSON or Postgres+pgvector).
//
// All operations are scoped by userId. Routes call these helpers; the adapter
// is chosen automatically based on whether DATABASE_URL is configured.

import { Chunk, Citation, Collection, DocumentMeta } from './types';
import { getStorage } from './storage';

export async function getCollections(userId: string): Promise<Collection[]> {
  return getStorage().getCollections(userId);
}

export async function createCollection(c: Collection): Promise<Collection> {
  return getStorage().createCollection(c);
}

export async function deleteCollection(userId: string, id: string): Promise<void> {
  return getStorage().deleteCollection(userId, id);
}

export async function getDocuments(
  userId: string,
  collectionId?: string,
): Promise<DocumentMeta[]> {
  return getStorage().getDocuments(userId, collectionId);
}

export async function saveDocument(doc: DocumentMeta): Promise<void> {
  return getStorage().saveDocument(doc);
}

export async function deleteDocument(userId: string, id: string): Promise<void> {
  return getStorage().deleteDocument(userId, id);
}

export async function addChunks(chunks: Chunk[]): Promise<void> {
  return getStorage().addChunks(chunks);
}

export async function search(
  queryEmbedding: number[],
  opts: { userId: string; collectionId?: string; topK?: number },
): Promise<Citation[]> {
  return getStorage().search(queryEmbedding, opts);
}
