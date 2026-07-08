// Postgres + pgvector storage adapter.
// Selected when DATABASE_URL is set. Creates pgvector extension + all tables on first use.

import { Pool } from 'pg';
import { Chunk, Citation, Collection, DocumentMeta, User, ChatSession, ChatSessionMessage } from '../types';
import { EMBED_DIM } from '../embeddings';
import { StorageAdapter, SearchOpts } from './adapter';

let pool: Pool | null = null;
function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
      max: 5,
    });
  }
  return pool;
}

function vecLiteral(v: number[]): string {
  return `[${v.join(',')}]`;
}

function friendlyDbError(err: unknown): Error {
  const message = err instanceof Error ? err.message : String(err);
  if (/different vector dimensions|expected \d+ dimensions/i.test(message)) {
    return new Error(
      'Embedding dimension mismatch. Re-upload your documents after changing the embedding model.',
    );
  }
  if (/type "vector" does not exist|could not open extension/i.test(message)) {
    return new Error(
      'pgvector extension is not enabled. Enable it from your Neon/Supabase dashboard under Extensions → vector, then retry.',
    );
  }
  if (/password authentication failed|ENOTFOUND|ECONNREFUSED|self-signed certificate/i.test(message)) {
    return new Error('Could not connect to the database. Check DATABASE_URL in your environment variables.');
  }
  return new Error('A database error occurred. Please try again.');
}

export class PostgresAdapter implements StorageAdapter {
  private ready = false;

  async init(): Promise<void> {
    if (this.ready) return;
    const db = getPool();

    await db.query('CREATE EXTENSION IF NOT EXISTS vector').catch(() => undefined);

    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`);
    await db.query(`
      CREATE TABLE IF NOT EXISTS collections (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`);
    await db.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        size INTEGER NOT NULL,
        chunk_count INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL,
        error TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`);
    await db.query(`
      CREATE TABLE IF NOT EXISTS chunks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
        idx INTEGER NOT NULL,
        text TEXT NOT NULL,
        embedding vector(${EMBED_DIM})
      )`);
    await db.query(
      'CREATE INDEX IF NOT EXISTS chunks_user_collection_idx ON chunks (user_id, collection_id)',
    );
    await db
      .query('CREATE INDEX IF NOT EXISTS chunks_embedding_hnsw_idx ON chunks USING hnsw (embedding vector_cosine_ops)')
      .catch(() => undefined);

    // Chat sessions
    await db.query(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        collection_id TEXT,
        message_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`);
    await db.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        citations JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`);
    await db.query(
      'CREATE INDEX IF NOT EXISTS chat_messages_session_idx ON chat_messages (session_id, created_at)',
    ).catch(() => undefined);

    this.ready = true;
  }

  // Users
  async createUser(user: User, passwordHash: string): Promise<User> {
    await this.init();
    await getPool().query(
      'INSERT INTO users (id, email, name, password_hash, created_at) VALUES ($1,$2,$3,$4,$5)',
      [user.id, user.email, user.name, passwordHash, user.createdAt],
    );
    return user;
  }

  async getUserByEmail(email: string): Promise<(User & { passwordHash: string }) | null> {
    await this.init();
    const { rows } = await getPool().query(
      'SELECT id, email, name, password_hash, created_at FROM users WHERE lower(email)=lower($1)',
      [email],
    );
    if (!rows.length) return null;
    const r = rows[0];
    return { id: r.id, email: r.email, name: r.name, createdAt: new Date(r.created_at).toISOString(), passwordHash: r.password_hash };
  }

  async getUserById(id: string): Promise<User | null> {
    await this.init();
    const { rows } = await getPool().query(
      'SELECT id, email, name, created_at FROM users WHERE id=$1', [id],
    );
    if (!rows.length) return null;
    const r = rows[0];
    return { id: r.id, email: r.email, name: r.name, createdAt: new Date(r.created_at).toISOString() };
  }

  async updateUser(userId: string, updates: { name?: string }): Promise<User | null> {
    await this.init();
    if (updates.name !== undefined) {
      await getPool().query('UPDATE users SET name=$1 WHERE id=$2', [updates.name, userId]);
    }
    return this.getUserById(userId);
  }

  // Collections
  async getCollections(userId: string): Promise<Collection[]> {
    await this.init();
    const { rows } = await getPool().query(
      'SELECT id, user_id, name, description, created_at FROM collections WHERE user_id=$1 ORDER BY created_at DESC',
      [userId],
    );
    return rows.map((r) => ({ id: r.id, userId: r.user_id, name: r.name, description: r.description || undefined, createdAt: new Date(r.created_at).toISOString() }));
  }

  async createCollection(c: Collection): Promise<Collection> {
    await this.init();
    await getPool().query(
      'INSERT INTO collections (id, user_id, name, description, created_at) VALUES ($1,$2,$3,$4,$5)',
      [c.id, c.userId, c.name, c.description || null, c.createdAt],
    );
    return c;
  }

  async updateCollection(userId: string, id: string, updates: { name?: string; description?: string }): Promise<Collection | null> {
    await this.init();
    const sets: string[] = [];
    const params: unknown[] = [];
    if (updates.name !== undefined) { params.push(updates.name); sets.push(`name=$${params.length}`); }
    if (updates.description !== undefined) { params.push(updates.description || null); sets.push(`description=$${params.length}`); }
    if (!sets.length) return null;
    params.push(id); params.push(userId);
    await getPool().query(`UPDATE collections SET ${sets.join(',')} WHERE id=$${params.length - 1} AND user_id=$${params.length}`, params);
    const { rows } = await getPool().query('SELECT id, user_id, name, description, created_at FROM collections WHERE id=$1', [id]);
    if (!rows.length) return null;
    const r = rows[0];
    return { id: r.id, userId: r.user_id, name: r.name, description: r.description || undefined, createdAt: new Date(r.created_at).toISOString() };
  }

  async deleteCollection(userId: string, id: string): Promise<void> {
    await this.init();
    await getPool().query('DELETE FROM collections WHERE id=$1 AND user_id=$2', [id, userId]);
  }

  // Documents
  async getDocuments(userId: string, collectionId?: string): Promise<DocumentMeta[]> {
    await this.init();
    const params: unknown[] = [userId];
    let sql = 'SELECT id, user_id, collection_id, name, type, size, chunk_count, status, error, created_at FROM documents WHERE user_id=$1';
    if (collectionId) { params.push(collectionId); sql += ' AND collection_id=$2'; }
    sql += ' ORDER BY created_at DESC';
    const { rows } = await getPool().query(sql, params);
    return rows.map((r) => ({
      id: r.id, userId: r.user_id, collectionId: r.collection_id, name: r.name,
      type: r.type, size: r.size, chunkCount: r.chunk_count, status: r.status,
      error: r.error || undefined, createdAt: new Date(r.created_at).toISOString(),
    }));
  }

  async saveDocument(doc: DocumentMeta): Promise<void> {
    await this.init();
    await getPool().query(
      `INSERT INTO documents (id, user_id, collection_id, name, type, size, chunk_count, status, error, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (id) DO UPDATE SET chunk_count=EXCLUDED.chunk_count, status=EXCLUDED.status, error=EXCLUDED.error`,
      [doc.id, doc.userId, doc.collectionId, doc.name, doc.type, doc.size, doc.chunkCount, doc.status, doc.error || null, doc.createdAt],
    );
  }

  async deleteDocument(userId: string, id: string): Promise<void> {
    await this.init();
    await getPool().query('DELETE FROM documents WHERE id=$1 AND user_id=$2', [id, userId]);
  }

  // Chunks
  async addChunks(chunks: Chunk[]): Promise<void> {
    if (!chunks.length) return;
    await this.init();
    const db = getPool();
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      for (const ch of chunks) {
        await client.query(
          `INSERT INTO chunks (id, user_id, document_id, collection_id, idx, text, embedding) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [ch.id, ch.userId, ch.documentId, ch.collectionId, ch.index, ch.text, vecLiteral(ch.embedding)],
        );
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw friendlyDbError(e);
    } finally {
      client.release();
    }
  }

  async getChunks(userId: string, documentId: string): Promise<Chunk[]> {
    await this.init();
    const { rows } = await getPool().query(
      'SELECT id, user_id, document_id, collection_id, idx, text FROM chunks WHERE user_id=$1 AND document_id=$2 ORDER BY idx',
      [userId, documentId],
    );
    return rows.map((r) => ({
      id: r.id, userId: r.user_id, documentId: r.document_id,
      collectionId: r.collection_id, index: r.idx, text: r.text, embedding: [],
    }));
  }

  async search(queryEmbedding: number[], opts: SearchOpts): Promise<Citation[]> {
    await this.init();
    try {
      const topK = opts.topK ?? 5;
      const params: unknown[] = [vecLiteral(queryEmbedding), opts.userId];
      let where = 'c.user_id=$2';
      if (opts.collectionId) { params.push(opts.collectionId); where += ' AND c.collection_id=$3'; }
      params.push(topK);
      const limitParam = `$${params.length}`;
      const { rows } = await getPool().query(
        `SELECT c.id, c.document_id, c.idx, c.text, d.name AS doc_name,
                1 - (c.embedding <=> $1) AS score
         FROM chunks c JOIN documents d ON d.id = c.document_id
         WHERE ${where}
         ORDER BY c.embedding <=> $1
         LIMIT ${limitParam}`,
        params,
      );
      return rows.map((r) => ({
        chunkId: r.id, documentId: r.document_id, documentName: r.doc_name || 'Unknown document',
        index: r.idx, text: r.text, score: Number(r.score),
      }));
    } catch (e) {
      throw friendlyDbError(e);
    }
  }

  // Chat sessions
  async getChatSessions(userId: string): Promise<ChatSession[]> {
    await this.init();
    const { rows } = await getPool().query(
      'SELECT id, user_id, title, collection_id, message_count, created_at, updated_at FROM chat_sessions WHERE user_id=$1 ORDER BY updated_at DESC',
      [userId],
    );
    return rows.map((r) => ({
      id: r.id, userId: r.user_id, title: r.title, collectionId: r.collection_id || undefined,
      messageCount: r.message_count,
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
    }));
  }

  async createChatSession(session: ChatSession): Promise<ChatSession> {
    await this.init();
    await getPool().query(
      'INSERT INTO chat_sessions (id, user_id, title, collection_id, message_count, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [session.id, session.userId, session.title, session.collectionId || null, session.messageCount, session.createdAt, session.updatedAt],
    );
    return session;
  }

  async updateChatSession(userId: string, sessionId: string, updates: { title?: string; messageCount?: number; updatedAt?: string }): Promise<void> {
    await this.init();
    const sets: string[] = ['updated_at=$1'];
    const params: unknown[] = [updates.updatedAt || new Date().toISOString()];
    if (updates.title !== undefined) { params.push(updates.title); sets.push(`title=$${params.length}`); }
    if (updates.messageCount !== undefined) { params.push(updates.messageCount); sets.push(`message_count=$${params.length}`); }
    params.push(sessionId); params.push(userId);
    await getPool().query(
      `UPDATE chat_sessions SET ${sets.join(',')} WHERE id=$${params.length - 1} AND user_id=$${params.length}`,
      params,
    );
  }

  async deleteChatSession(userId: string, sessionId: string): Promise<void> {
    await this.init();
    await getPool().query('DELETE FROM chat_sessions WHERE id=$1 AND user_id=$2', [sessionId, userId]);
  }

  async getChatMessages(userId: string, sessionId: string): Promise<ChatSessionMessage[]> {
    await this.init();
    const { rows } = await getPool().query(
      'SELECT id, session_id, user_id, role, content, citations, created_at FROM chat_messages WHERE session_id=$1 AND user_id=$2 ORDER BY created_at',
      [sessionId, userId],
    );
    return rows.map((r) => ({
      id: r.id, sessionId: r.session_id, userId: r.user_id, role: r.role as 'user' | 'assistant',
      content: r.content, citations: r.citations || undefined, createdAt: new Date(r.created_at).toISOString(),
    }));
  }

  async addChatMessage(msg: ChatSessionMessage): Promise<void> {
    await this.init();
    await getPool().query(
      'INSERT INTO chat_messages (id, session_id, user_id, role, content, citations, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [msg.id, msg.sessionId, msg.userId, msg.role, msg.content, msg.citations ? JSON.stringify(msg.citations) : null, msg.createdAt],
    );
  }
}
