/**
 * StorageAdapter interface — replaces older storage implementations.
 * Kept for backward compatibility. Use lib/store.ts for all new code.
 */
import type { User, Collection, DocumentMeta, Chunk, Citation } from '@/lib/types';

export interface SearchOpts {
  userId:        string;
  collectionId?: string;
  topK?:         number;
}

export interface StorageAdapter {
  /* Users */
  getUser(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  saveUser(user: User): Promise<void>;
  updateUser(id: string, patch: Partial<User>): Promise<void>;

  /* Collections */
  getCollections(userId: string): Promise<Collection[]>;
  getCollection(id: string): Promise<Collection | null>;
  saveCollection(col: Collection): Promise<void>;
  updateCollection(id: string, patch: Partial<Collection>): Promise<void>;
  deleteCollection(id: string): Promise<void>;

  /* Documents */
  getDocuments(userId: string, collectionId?: string): Promise<DocumentMeta[]>;
  getDocument(id: string): Promise<DocumentMeta | null>;
  saveDocument(doc: DocumentMeta): Promise<void>;
  deleteDocument(id: string): Promise<void>;

  /* Chunks */
  addChunks(chunks: Chunk[]): Promise<void>;
  deleteChunks(documentId: string): Promise<void>;

  /* Vector search */
  search(queryEmbedding: number[], opts: SearchOpts): Promise<Citation[]>;
}
