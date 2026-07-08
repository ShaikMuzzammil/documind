// In-memory / JSON fallback adapter (no DATABASE_URL set).
// Data lives in module-level Maps — reset on every cold start (Vercel).
// Use only for local development and demos; not for production.

import { Chunk, Citation, Collection, DocumentMeta, User, ChatSession, ChatSessionMessage } from '../types';
import { cosineSimilarity } from '../embeddings';
import { StorageAdapter, SearchOpts } from './adapter';

const users    = new Map<string, User & { passwordHash: string }>();
const colls    = new Map<string, Collection>();
const docs     = new Map<string, DocumentMeta>();
const chunks   = new Map<string, Chunk>();
const sessions = new Map<string, ChatSession>();
const messages = new Map<string, ChatSessionMessage>();

export class JsonAdapter implements StorageAdapter {
  async createUser(user: User, passwordHash: string): Promise<User> {
    users.set(user.id, { ...user, passwordHash });
    return user;
  }

  async getUserByEmail(email: string): Promise<(User & { passwordHash: string }) | null> {
    for (const u of users.values()) {
      if (u.email.toLowerCase() === email.toLowerCase()) return u;
    }
    return null;
  }

  async getUserById(id: string): Promise<User | null> {
    const u = users.get(id);
    if (!u) return null;
    const { passwordHash: _, ...rest } = u;
    return rest;
  }

  async updateUser(userId: string, updates: { name?: string }): Promise<User | null> {
    const u = users.get(userId);
    if (!u) return null;
    if (updates.name) u.name = updates.name;
    users.set(userId, u);
    const { passwordHash: _, ...rest } = u;
    return rest;
  }

  async getCollections(userId: string): Promise<Collection[]> {
    return [...colls.values()].filter(c => c.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async createCollection(c: Collection): Promise<Collection> {
    colls.set(c.id, c);
    return c;
  }

  async updateCollection(userId: string, id: string, updates: { name?: string; description?: string }): Promise<Collection | null> {
    const c = colls.get(id);
    if (!c || c.userId !== userId) return null;
    if (updates.name !== undefined) c.name = updates.name;
    if (updates.description !== undefined) c.description = updates.description;
    colls.set(id, c);
    return c;
  }

  async deleteCollection(userId: string, id: string): Promise<void> {
    const c = colls.get(id);
    if (c?.userId === userId) colls.delete(id);
  }

  async getDocuments(userId: string, collectionId?: string): Promise<DocumentMeta[]> {
    return [...docs.values()]
      .filter(d => d.userId === userId && (!collectionId || d.collectionId === collectionId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async saveDocument(doc: DocumentMeta): Promise<void> {
    docs.set(doc.id, doc);
  }

  async deleteDocument(userId: string, id: string): Promise<void> {
    const d = docs.get(id);
    if (d?.userId === userId) docs.delete(id);
  }

  async addChunks(newChunks: Chunk[]): Promise<void> {
    for (const ch of newChunks) chunks.set(ch.id, ch);
  }

  async getChunks(userId: string, documentId: string): Promise<Chunk[]> {
    return [...chunks.values()]
      .filter(c => c.userId === userId && c.documentId === documentId)
      .sort((a, b) => a.index - b.index);
  }

  async search(queryEmbedding: number[], opts: SearchOpts): Promise<Citation[]> {
    const topK = opts.topK ?? 5;
    const docMap = new Map([...docs.values()].map(d => [d.id, d]));
    const scored = [...chunks.values()]
      .filter(c => c.userId === opts.userId && (!opts.collectionId || c.collectionId === opts.collectionId))
      .map(c => ({ c, score: cosineSimilarity(queryEmbedding, c.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
    return scored.map(({ c, score }) => ({
      chunkId: c.id, documentId: c.documentId,
      documentName: docMap.get(c.documentId)?.name || 'Unknown document',
      index: c.index, text: c.text, score,
    }));
  }

  // Chat sessions
  async getChatSessions(userId: string): Promise<ChatSession[]> {
    return [...sessions.values()].filter(s => s.userId === userId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async createChatSession(session: ChatSession): Promise<ChatSession> {
    sessions.set(session.id, session);
    return session;
  }

  async updateChatSession(userId: string, sessionId: string, updates: { title?: string; messageCount?: number; updatedAt?: string }): Promise<void> {
    const s = sessions.get(sessionId);
    if (!s || s.userId !== userId) return;
    if (updates.title !== undefined) s.title = updates.title;
    if (updates.messageCount !== undefined) s.messageCount = updates.messageCount;
    s.updatedAt = updates.updatedAt || new Date().toISOString();
    sessions.set(sessionId, s);
  }

  async deleteChatSession(userId: string, sessionId: string): Promise<void> {
    const s = sessions.get(sessionId);
    if (s?.userId === userId) {
      sessions.delete(sessionId);
      for (const [id, msg] of messages) {
        if (msg.sessionId === sessionId) messages.delete(id);
      }
    }
  }

  async getChatMessages(userId: string, sessionId: string): Promise<ChatSessionMessage[]> {
    return [...messages.values()]
      .filter(m => m.sessionId === sessionId && m.userId === userId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async addChatMessage(msg: ChatSessionMessage): Promise<void> {
    messages.set(msg.id, msg);
  }
}
