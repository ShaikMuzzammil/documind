/**
 * Unified store — delegates to Postgres+pgvector or local JSON file store.
 * Uses static imports so Next.js tree-shakes correctly.
 */
import type { Collection, Chunk, DocumentMeta, User } from '@/lib/types';
import type { Citation } from '@/lib/types';

const USE_PG = Boolean(process.env.DATABASE_URL);

async function pg()   { return import('@/lib/db-postgres'); }
async function json() { return import('@/lib/db-json'); }
const store = () => USE_PG ? pg() : json();

/* Users */
export const getUser         = async (id: string): Promise<User | null> => (await store()).getUser(id);
export const getUserByEmail  = async (e: string): Promise<User | null> => (await store()).getUserByEmail(e);
export const saveUser        = async (u: User):   Promise<void>         => (await store()).saveUser(u);
export const updateUser      = async (id: string, patch: Partial<User>): Promise<void> => (await store()).updateUser(id, patch);

/* Collections */
export const getCollections   = async (uid: string): Promise<Collection[]>    => (await store()).getCollections(uid);
export const getCollection    = async (id: string):  Promise<Collection|null> => (await store()).getCollection(id);
export const saveCollection   = async (c: Collection): Promise<void>          => (await store()).saveCollection(c);
export const updateCollection = async (id: string, patch: Partial<Collection>): Promise<void> => (await store()).updateCollection(id, patch);
export const deleteCollection = async (id: string): Promise<void>             => (await store()).deleteCollection(id);

/* Documents */
export const getDocuments = async (uid: string, colId?: string): Promise<DocumentMeta[]>    => (await store()).getDocuments(uid, colId);
export const getDocument  = async (id: string):                   Promise<DocumentMeta|null> => (await store()).getDocument(id);
export const saveDocument = async (d: DocumentMeta): Promise<void>                           => (await store()).saveDocument(d);
export const deleteDocument = async (id: string):    Promise<void>                           => (await store()).deleteDocument(id);

/* Chunks */
export const addChunks    = async (chunks: Chunk[]): Promise<void> => (await store()).addChunks(chunks);
export const deleteChunks = async (docId: string):  Promise<void>  => (await store()).deleteChunks(docId);

/* Vector search */
export const search = async (
  qEmbed: number[],
  opts:   { userId: string; collectionId?: string; topK?: number },
): Promise<Citation[]> => (await store()).search(qEmbed, opts);
