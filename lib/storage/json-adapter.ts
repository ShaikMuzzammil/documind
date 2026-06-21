// JSON-file storage adapter (zero external dependencies).
//
// Used automatically when DATABASE_URL is not configured. Data is isolated per
// user. Suitable for local development and single-user demos.

import { promises as fs } from 'fs';
import path from 'path';
import { Chunk, Citation, Collection, DocumentMeta, User } from '../types';
import { cosineSimilarity } from '../embeddings';
import { StorageAdapter, SearchOpts } from './adapter';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const COLLECTIONS_FILE = path.join(DATA_DIR, 'collections.json');
const DOCUMENTS_FILE = path.join(DATA_DIR, 'documents.json');
const CHUNKS_FILE = path.join(DATA_DIR, 'chunks.json');

type StoredUser = User & { passwordHash: string };

async function ensureDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(file, 'utf-8')) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, data: unknown): Promise<void> {
  await ensureDir();
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf-8');
}

export class JsonAdapter implements StorageAdapter {
  async init(): Promise<void> {
    await ensureDir();
  }

  // ── Users ──
  async createUser(user: User, passwordHash: string): Promise<User> {
    const all = await readJson<StoredUser[]>(USERS_FILE, []);
    all.push({ ...user, passwordHash });
    await writeJson(USERS_FILE, all);
    return user;
  }

  async getUserByEmail(email: string): Promise<StoredUser | null> {
    const all = await readJson<StoredUser[]>(USERS_FILE, []);
    return all.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async getUserById(id: string): Promise<User | null> {
    const all = await readJson<StoredUser[]>(USERS_FILE, []);
    const u = all.find((x) => x.id === id);
    if (!u) return null;
    return { id: u.id, email: u.email, name: u.name, createdAt: u.createdAt };
  }

  // ── Collections ──
  async getCollections(userId: string): Promise<Collection[]> {
    const all = await readJson<Collection[]>(COLLECTIONS_FILE, []);
    return all.filter((c) => c.userId === userId);
  }

  async createCollection(c: Collection): Promise<Collection> {
    const all = await readJson<Collection[]>(COLLECTIONS_FILE, []);
    await writeJson(COLLECTIONS_FILE, [c, ...all]);
    return c;
  }

  async deleteCollection(userId: string, id: string): Promise<void> {
    const cols = (await readJson<Collection[]>(COLLECTIONS_FILE, [])).filter(
      (c) => !(c.id === id && c.userId === userId),
    );
    await writeJson(COLLECTIONS_FILE, cols);
    const docs = (await readJson<DocumentMeta[]>(DOCUMENTS_FILE, [])).filter(
      (d) => !(d.collectionId === id && d.userId === userId),
    );
    await writeJson(DOCUMENTS_FILE, docs);
    const chunks = (await readJson<Chunk[]>(CHUNKS_FILE, [])).filter(
      (ch) => !(ch.collectionId === id && ch.userId === userId),
    );
    await writeJson(CHUNKS_FILE, chunks);
  }

  // ── Documents ──
  async getDocuments(userId: string, collectionId?: string): Promise<DocumentMeta[]> {
    let all = (await readJson<DocumentMeta[]>(DOCUMENTS_FILE, [])).filter(
      (d) => d.userId === userId,
    );
    if (collectionId) all = all.filter((d) => d.collectionId === collectionId);
    return all;
  }

  async saveDocument(doc: DocumentMeta): Promise<void> {
    const all = (await readJson<DocumentMeta[]>(DOCUMENTS_FILE, [])).filter(
      (d) => d.id !== doc.id,
    );
    await writeJson(DOCUMENTS_FILE, [doc, ...all]);
  }

  async deleteDocument(userId: string, id: string): Promise<void> {
    const docs = (await readJson<DocumentMeta[]>(DOCUMENTS_FILE, [])).filter(
      (d) => !(d.id === id && d.userId === userId),
    );
    await writeJson(DOCUMENTS_FILE, docs);
    const chunks = (await readJson<Chunk[]>(CHUNKS_FILE, [])).filter(
      (ch) => !(ch.documentId === id && ch.userId === userId),
    );
    await writeJson(CHUNKS_FILE, chunks);
  }

  // ── Chunks + retrieval ──
  async addChunks(newChunks: Chunk[]): Promise<void> {
    const all = await readJson<Chunk[]>(CHUNKS_FILE, []);
    await writeJson(CHUNKS_FILE, [...all, ...newChunks]);
  }

  async search(queryEmbedding: number[], opts: SearchOpts): Promise<Citation[]> {
    const topK = opts.topK ?? 5;
    const docs = await this.getDocuments(opts.userId);
    const docName = new Map(docs.map((d) => [d.id, d.name]));

    let chunks = (await readJson<Chunk[]>(CHUNKS_FILE, [])).filter(
      (c) => c.userId === opts.userId,
    );
    if (opts.collectionId) chunks = chunks.filter((c) => c.collectionId === opts.collectionId);

    return chunks
      .map((c) => ({ chunk: c, score: cosineSimilarity(queryEmbedding, c.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(({ chunk, score }) => ({
        chunkId: chunk.id,
        documentId: chunk.documentId,
        documentName: docName.get(chunk.documentId) || 'Unknown document',
        index: chunk.index,
        text: chunk.text,
        score,
      }));
  }
}
