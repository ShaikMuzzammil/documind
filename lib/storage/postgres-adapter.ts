// Postgres + pgvector storage adapter.
// Selected when DATABASE_URL is set.
// Creates pgvector extension + all tables on first use.

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
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return pool;
}

function vecLiteral(v: number[]): string {
  return `[${v.join(',')}]`;
}

/** Maps ANY Postgres/pgvector error to a human-readable message. */
function friendlyDbError(err: unknown): Error {
  const message = err instanceof Error ? err.message : String(err);
  const code    = (err as { code?: string })?.code ?? '';

  // pgvector extension missing
  if (/type "vector" does not exist|could not open extension/i.test(message)) {
    return new Error(
      'pgvector extension is not enabled. Go to your Neon/Supabase dashboard → Extensions → search "vector" → Enable. Then retry the upload.',
    );
  }
  // Dimension mismatch
  if (/different vector dimensions|expected \d+ dimensions/i.test(message)) {
    return new Error(
      'Embedding dimension mismatch. Your database was created with a different EMBED_DIM. ' +
      'Set EMBED_DIM to match your model, or drop and recreate the chunks table.',
    );
  }
  // Connection / auth errors
  if (/password authentication failed|ENOTFOUND|ECONNREFUSED|self-signed certificate|connection timeout/i.test(message) ||
      code.startsWith('08')) {
    return new Error('Cannot connect to the database. Check DATABASE_URL in your environment variables.');
  }
  // FK violation — e.g. collectionId doesn't exist in collections table
  if (code === '23503' || /foreign key constraint/i.test(message)) {
    return new Error(
      'The selected collection does not exist in the database. ' +
      'Create a collection first, then re-upload.',
    );
  }
  // Unique constraint
  if (code === '23505' || /unique constraint|duplicate key/i.test(message)) {
    return new Error('This document already exists. Delete the existing copy first, then re-upload.');
  }
  // Column doesn't exist (e.g. schema drift)
  if (code === '42703' || /column .* does not exist/i.test(message)) {
    return new Error(
      'Database schema is out of date. The required column is missing. ' +
      'If you upgraded DocuMind, run the migration or drop and recreate the tables.',
    );
  }
  // Table doesn't exist
  if (code === '42P01' || /relation .* does not exist/i.test(message)) {
    return new Error(
      'Database tables are missing. The database schema may not have been initialised. ' +
      'Check that your DATABASE_URL is correct and that init ran successfully.',
    );
  }
  // Syntax error — shouldn't happen in production but useful for debugging
  if (code === '42601') {
    return new Error('SQL syntax error — this is a bug. Please report it on GitHub.');
  }
  // Out of memory / disk / server errors
  if (code.startsWith('53') || code.startsWith('58')) {
    return new Error('The database server is out of resources. Contact your DB provider.');
  }

  // Generic fallback with the raw message stripped of stack noise
  const raw = message.split('\n')[0].slice(0, 200);
  return new Error(`A database error occurred: ${raw}`);
}

export class PostgresAdapter implements StorageAdapter {
  private ready = false;

  async init(): Promise<void> {
    if (this.ready) return;
    const db = getPool();

    // pgvector — silently continue; tables will fail below if missing
    try { await db.query('CREATE EXTENSION IF NOT EXISTS vector'); }
    catch { /* pgvector may already exist, or user needs to enable it via dashboard */ }

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

    // chunks table — may throw if pgvector not installed
    try {
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
    } catch (err) {
      throw friendlyDbError(err);
    }

    await db.query(
      'CREATE INDEX IF NOT EXISTS chunks_user_collection_idx ON chunks (user_id, collection_id)',
    ).catch(() => undefined);

    await db.query(
      'CREATE INDEX IF NOT EXISTS chunks_embedding_hnsw_idx ON chunks USING hnsw (embedding vector_cosine_ops)',
    ).catch(() => undefined);

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

  /** Call from /api/health — returns { ok, details } */
  async healthCheck(): Promise<{ ok: boolean; pgvector: boolean; tables: string[]; error?: string }> {
    try {
      const db = getPool();
      // Check pgvector
      const extRes = await db.query(
        "SELECT 1 FROM pg_extension WHERE extname = 'vector'",
      ).catch(() => ({ rows: [] as unknown[] }));
      const pgvector = (extRes?.rows?.length ?? 0) > 0;

      // Check which tables exist
      const tableRes = await db.query(
        "SELECT tablename FROM pg_tables WHERE schemaname = 'public'",
      );
      const tables: string[] = tableRes.rows.map((r: { tablename: string }) => r.tablename);
      return { ok: true, pgvector, tables };
    } catch (err) {
      return { ok: false, pgvector: false, tables: [], error: err instanceof Error ? err.message : String(err) };
    }
  }

  // ─── Users ───────────────────────────────────────────────────────────────────

  async createUser(user: User, passwordHash: string): Promise<User> {
    try {
      await this.init();
      await getPool().query(
        'INSERT INTO users (id, email, name, password_hash, created_at) VALUES ($1,$2,$3,$4,$5)',
        [user.id, user.email, user.name, passwordHash, user.createdAt],
      );
      return user;
    } catch (err) { throw friendlyDbError(err); }
  }

  async getUserByEmail(email: string): Promise<(User & { passwordHash: string }) | null> {
    try {
      await this.init();
      const { rows } = await getPool().query(
        'SELECT id, email, name, password_hash, created_at FROM users WHERE lower(email)=lower($1)',
        [email],
      );
      if (!rows.length) return null;
      const r = rows[0];
      return { id: r.id, email: r.email, name: r.name, createdAt: new Date(r.created_at).toISOString(), passwordHash: r.password_hash };
    } catch (err) { throw friendlyDbError(err); }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      await this.init();
      const { rows } = await getPool().query(
        'SELECT id, email, name, created_at FROM users WHERE id=$1', [id],
      );
      if (!rows.length) return null;
      const r = rows[0];
      return { id: r.id, email: r.email, name: r.name, createdAt: new Date(r.created_at).toISOString() };
    } catch (err) { throw friendlyDbError(err); }
  }

  async updateUser(userId: string, updates: { name?: string }): Promise<User | null> {
    try {
      await this.init();
      if (updates.name !== undefined) {
        await getPool().query('UPDATE users SET name=$1 WHERE id=$2', [updates.name, userId]);
      }
      return this.getUserById(userId);
    } catch (err) { throw friendlyDbError(err); }
  }

  // ─── Collections ─────────────────────────────────────────────────────────────

  async getCollections(userId: string): Promise<Collection[]> {
    try {
      await this.init();
      const { rows } = await getPool().query(
        'SELECT id, user_id, name, description, created_at FROM collections WHERE user_id=$1 ORDER BY created_at DESC',
        [userId],
      );
      return rows.map((r) => ({ id: r.id, userId: r.user_id, name: r.name, description: r.description || undefined, createdAt: new Date(r.created_at).toISOString() }));
    } catch (err) { throw friendlyDbError(err); }
  }

  async createCollection(c: Collection): Promise<Collection> {
    try {
      await this.init();
      await getPool().query(
        'INSERT INTO collections (id, user_id, name, description, created_at) VALUES ($1,$2,$3,$4,$5)',
        [c.id, c.userId, c.name, c.description || null, c.createdAt],
      );
      return c;
    } catch (err) { throw friendlyDbError(err); }
  }

  async updateCollection(userId: string, id: string, updates: { name?: string; description?: string }): Promise<Collection | null> {
    try {
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
    } catch (err) { throw friendlyDbError(err); }
  }

  async deleteCollection(userId: string, id: string): Promise<void> {
    try {
      await this.init();
      await getPool().query('DELETE FROM collections WHERE id=$1 AND user_id=$2', [id, userId]);
    } catch (err) { throw friendlyDbError(err); }
  }

  // ─── Documents ───────────────────────────────────────────────────────────────

  async getDocuments(userId: string, collectionId?: string): Promise<DocumentMeta[]> {
    try {
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
    } catch (err) { throw friendlyDbError(err); }
  }

  async saveDocument(doc: DocumentMeta): Promise<void> {
    try {
      await this.init();
      await getPool().query(
        `INSERT INTO documents (id, user_id, collection_id, name, type, size, chunk_count, status, error, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (id) DO UPDATE SET chunk_count=EXCLUDED.chunk_count, status=EXCLUDED.status, error=EXCLUDED.error`,
        [doc.id, doc.userId, doc.collectionId, doc.name, doc.type, doc.size, doc.chunkCount, doc.status, doc.error || null, doc.createdAt],
      );
    } catch (err) { throw friendlyDbError(err); }
  }

  async deleteDocument(userId: string, id: string): Promise<void> {
    try {
      await this.init();
      await getPool().query('DELETE FROM documents WHERE id=$1 AND user_id=$2', [id, userId]);
    } catch (err) { throw friendlyDbError(err); }
  }

  // ─── Chunks ──────────────────────────────────────────────────────────────────

  async addChunks(chunks: Chunk[]): Promise<void> {
    if (!chunks.length) return;
    try {
      await this.init();
      const db = getPool();
      const client = await db.connect();
      try {
        await client.query('BEGIN');
        for (const ch of chunks) {
          await client.query(
            'INSERT INTO chunks (id, user_id, document_id, collection_id, idx, text, embedding) VALUES ($1,$2,$3,$4,$5,$6,$7)',
            [ch.id, ch.userId, ch.documentId, ch.collectionId, ch.index, ch.text, vecLiteral(ch.embedding)],
          );
        }
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK').catch(() => undefined);
        throw e;
      } finally {
        client.release();
      }
    } catch (err) { throw friendlyDbError(err); }
  }

  async getChunks(userId: string, documentId: string): Promise<Chunk[]> {
    try {
      await this.init();
      const { rows } = await getPool().query(
        'SELECT id, user_id, document_id, collection_id, idx, text FROM chunks WHERE user_id=$1 AND document_id=$2 ORDER BY idx',
        [userId, documentId],
      );
      return rows.map((r) => ({
        id: r.id, userId: r.user_id, documentId: r.document_id,
        collectionId: r.collection_id, index: r.idx, text: r.text, embedding: [],
      }));
    } catch (err) { throw friendlyDbError(err); }
  }

  async search(queryEmbedding: number[], opts: SearchOpts): Promise<Citation[]> {
    try {
      await this.init();
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
    } catch (err) { throw friendlyDbError(err); }
  }

  // ─── Chat sessions ────────────────────────────────────────────────────────────

  async getChatSessions(userId: string): Promise<ChatSession[]> {
    try {
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
    } catch (err) { throw friendlyDbError(err); }
  }

  async createChatSession(session: ChatSession): Promise<ChatSession> {
    try {
      await this.init();
      await getPool().query(
        'INSERT INTO chat_sessions (id, user_id, title, collection_id, message_count, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [session.id, session.userId, session.title, session.collectionId || null, session.messageCount, session.createdAt, session.updatedAt],
      );
      return session;
    } catch (err) { throw friendlyDbError(err); }
  }

  async updateChatSession(userId: string, sessionId: string, updates: { title?: string; messageCount?: number; updatedAt?: string }): Promise<void> {
    try {
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
    } catch (err) { throw friendlyDbError(err); }
  }

  async deleteChatSession(userId: string, sessionId: string): Promise<void> {
    try {
      await this.init();
      await getPool().query('DELETE FROM chat_sessions WHERE id=$1 AND user_id=$2', [sessionId, userId]);
    } catch (err) { throw friendlyDbError(err); }
  }

  async getChatMessages(userId: string, sessionId: string): Promise<ChatSessionMessage[]> {
    try {
      await this.init();
      const { rows } = await getPool().query(
        'SELECT id, session_id, user_id, role, content, citations, created_at FROM chat_messages WHERE session_id=$1 AND user_id=$2 ORDER BY created_at',
        [sessionId, userId],
      );
      return rows.map((r) => ({
        id: r.id, sessionId: r.session_id, userId: r.user_id, role: r.role as 'user' | 'assistant',
        content: r.content, citations: r.citations || undefined, createdAt: new Date(r.created_at).toISOString(),
      }));
    } catch (err) { throw friendlyDbError(err); }
  }

  async addChatMessage(msg: ChatSessionMessage): Promise<void> {
    try {
      await this.init();
      await getPool().query(
        'INSERT INTO chat_messages (id, session_id, user_id, role, content, citations, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [msg.id, msg.sessionId, msg.userId, msg.role, msg.content, msg.citations ? JSON.stringify(msg.citations) : null, msg.createdAt],
      );
    } catch (err) { throw friendlyDbError(err); }
  }
}
