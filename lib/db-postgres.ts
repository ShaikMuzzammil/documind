import { Pool } from 'pg';
import { Citation, Chunk, Collection, DocumentMeta, User } from '@/lib/types';

const ssl = process.env.DATABASE_SSL !== 'false' ? { rejectUnauthorized: false } : false;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: ssl || undefined,
  max: 10,
});

async function init() {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS vector;

    CREATE TABLE IF NOT EXISTS dm_users (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS dm_collections (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL,
      description TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS dm_documents (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL,
      type TEXT, size BIGINT, collection_id TEXT NOT NULL, chunk_count INT DEFAULT 0,
      status TEXT DEFAULT 'processing', error TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS dm_chunks (
      id TEXT PRIMARY KEY, document_id TEXT NOT NULL, user_id TEXT NOT NULL,
      collection_id TEXT NOT NULL, text TEXT NOT NULL, embedding vector(768), idx INT
    );
    CREATE INDEX IF NOT EXISTS dm_chunks_emb ON dm_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
  `);
}

let initialised = false;
async function ensureInit() {
  if (!initialised) { await init(); initialised = true; }
}

/* Users */
export async function getUser(id: string): Promise<User | null> {
  await ensureInit();
  const r = await pool.query('SELECT * FROM dm_users WHERE id=$1', [id]);
  if (!r.rows[0]) return null;
  const u = r.rows[0];
  return { id: u.id, name: u.name, email: u.email, passwordHash: u.password_hash, createdAt: u.created_at };
}
export async function getUserByEmail(email: string): Promise<User | null> {
  await ensureInit();
  const r = await pool.query('SELECT * FROM dm_users WHERE LOWER(email)=LOWER($1)', [email]);
  if (!r.rows[0]) return null;
  const u = r.rows[0];
  return { id: u.id, name: u.name, email: u.email, passwordHash: u.password_hash, createdAt: u.created_at };
}
export async function saveUser(user: User): Promise<void> {
  await ensureInit();
  await pool.query(
    `INSERT INTO dm_users (id,name,email,password_hash,created_at) VALUES($1,$2,$3,$4,$5)
     ON CONFLICT (id) DO UPDATE SET name=$2,email=$3,password_hash=$4`,
    [user.id, user.name, user.email, user.passwordHash, user.createdAt],
  );
}
export async function updateUser(id: string, patch: Partial<User>): Promise<void> {
  await ensureInit();
  if (patch.name)         await pool.query('UPDATE dm_users SET name=$2 WHERE id=$1', [id, patch.name]);
  if (patch.passwordHash) await pool.query('UPDATE dm_users SET password_hash=$2 WHERE id=$1', [id, patch.passwordHash]);
}

/* Collections */
export async function getCollections(userId: string): Promise<Collection[]> {
  await ensureInit();
  const r = await pool.query('SELECT * FROM dm_collections WHERE user_id=$1 ORDER BY created_at DESC', [userId]);
  return r.rows.map((c) => ({ id: c.id, userId: c.user_id, name: c.name, description: c.description, createdAt: c.created_at, updatedAt: c.updated_at }));
}
export async function getCollection(id: string): Promise<Collection | null> {
  await ensureInit();
  const r = await pool.query('SELECT * FROM dm_collections WHERE id=$1', [id]);
  if (!r.rows[0]) return null;
  const c = r.rows[0];
  return { id: c.id, userId: c.user_id, name: c.name, description: c.description, createdAt: c.created_at, updatedAt: c.updated_at };
}
export async function saveCollection(col: Collection): Promise<void> {
  await ensureInit();
  await pool.query(
    `INSERT INTO dm_collections(id,user_id,name,description,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6)
     ON CONFLICT(id) DO UPDATE SET name=$3,description=$4,updated_at=$6`,
    [col.id, col.userId, col.name, col.description ?? '', col.createdAt, col.updatedAt],
  );
}
export async function updateCollection(id: string, patch: Partial<Collection>): Promise<void> {
  await ensureInit();
  await pool.query('UPDATE dm_collections SET name=COALESCE($2,name),description=COALESCE($3,description),updated_at=NOW() WHERE id=$1',
    [id, patch.name, patch.description]);
}
export async function deleteCollection(id: string): Promise<void> {
  await ensureInit();
  await pool.query('DELETE FROM dm_collections WHERE id=$1', [id]);
}

/* Documents */
export async function getDocuments(userId: string, collectionId?: string): Promise<DocumentMeta[]> {
  await ensureInit();
  const r = collectionId
    ? await pool.query('SELECT * FROM dm_documents WHERE user_id=$1 AND collection_id=$2 ORDER BY created_at DESC', [userId, collectionId])
    : await pool.query('SELECT * FROM dm_documents WHERE user_id=$1 ORDER BY created_at DESC', [userId]);
  return r.rows.map(mapDoc);
}
export async function getDocument(id: string): Promise<DocumentMeta | null> {
  await ensureInit();
  const r = await pool.query('SELECT * FROM dm_documents WHERE id=$1', [id]);
  return r.rows[0] ? mapDoc(r.rows[0]) : null;
}
function mapDoc(d: Record<string,unknown>): DocumentMeta {
  return { id: d.id as string, userId: d.user_id as string, name: d.name as string, type: d.type as string, size: Number(d.size), collectionId: d.collection_id as string, chunkCount: Number(d.chunk_count), status: d.status as DocumentMeta['status'], error: d.error as string|undefined, createdAt: String(d.created_at) };
}
export async function saveDocument(doc: DocumentMeta): Promise<void> {
  await ensureInit();
  await pool.query(
    `INSERT INTO dm_documents(id,user_id,name,type,size,collection_id,chunk_count,status,error,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT(id) DO UPDATE SET name=$3,chunk_count=$7,status=$8,error=$9`,
    [doc.id,doc.userId,doc.name,doc.type,doc.size,doc.collectionId,doc.chunkCount,doc.status,doc.error??null,doc.createdAt],
  );
}
export async function deleteDocument(id: string): Promise<void> {
  await ensureInit();
  await pool.query('DELETE FROM dm_documents WHERE id=$1', [id]);
}

/* Chunks */
export async function addChunks(chunks: Chunk[]): Promise<void> {
  await ensureInit();
  for (const c of chunks) {
    await pool.query(
      'INSERT INTO dm_chunks(id,document_id,user_id,collection_id,text,embedding,idx) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(id) DO NOTHING',
      [c.id, c.documentId, c.userId, c.collectionId, c.text, JSON.stringify(c.embedding), c.index],
    );
  }
}
export async function deleteChunks(documentId: string): Promise<void> {
  await ensureInit();
  await pool.query('DELETE FROM dm_chunks WHERE document_id=$1', [documentId]);
}

/* Vector search */
export async function search(
  queryEmbedding: number[],
  opts: { userId: string; collectionId?: string; topK?: number },
): Promise<Citation[]> {
  await ensureInit();
  const topK = opts.topK ?? 5;
  const embStr = JSON.stringify(queryEmbedding);
  const r = opts.collectionId
    ? await pool.query(
        `SELECT c.*, d.name as doc_name, 1 - (c.embedding <=> $1::vector) AS score
         FROM dm_chunks c JOIN dm_documents d ON d.id=c.document_id
         WHERE c.user_id=$2 AND c.collection_id=$3
         ORDER BY c.embedding <=> $1::vector LIMIT $4`,
        [embStr, opts.userId, opts.collectionId, topK],
      )
    : await pool.query(
        `SELECT c.*, d.name as doc_name, 1 - (c.embedding <=> $1::vector) AS score
         FROM dm_chunks c JOIN dm_documents d ON d.id=c.document_id
         WHERE c.user_id=$2
         ORDER BY c.embedding <=> $1::vector LIMIT $3`,
        [embStr, opts.userId, topK],
      );
  return r.rows.map((row) => ({
    chunkId:      row.id,
    documentId:   row.document_id,
    documentName: row.doc_name,
    text:         row.text,
    score:        parseFloat(row.score),
    index:        row.idx,
  }));
}
