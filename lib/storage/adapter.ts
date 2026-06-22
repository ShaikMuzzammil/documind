// Storage adapter contract.
//
// Both the JSON-file adapter (zero-setup) and the Postgres + pgvector adapter
// implement this interface. All methods are scoped by userId so data is
// isolated per account.

import { Chunk, Citation, Collection, DocumentMeta, User } from '../types';

export interface SearchOpts {
  userId: string;
  collectionId?: string;
  topK?: number;
}

export interface StorageAdapter {
  init(): Promise<void>;

  // Users
  createUser(user: User, passwordHash: string): Promise<User>;
  getUserByEmail(email: string): Promise<(User & { passwordHash: string }) | null>;
  getUserById(id: string): Promise<User | null>;

  // Collections
  getCollections(userId: string): Promise<Collection[]>;
  createCollection(c: Collection): Promise<Collection>;
  deleteCollection(userId: string, id: string): Promise<void>;

  // Documents
  getDocuments(userId: string, collectionId?: string): Promise<DocumentMeta[]>;
  saveDocument(doc: DocumentMeta): Promise<void>;
  deleteDocument(userId: string, id: string): Promise<void>;

  // Chunks + retrieval
  addChunks(chunks: Chunk[]): Promise<void>;
  search(queryEmbedding: number[], opts: SearchOpts): Promise<Citation[]>;
}
