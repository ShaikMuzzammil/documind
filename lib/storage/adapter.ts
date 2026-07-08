import { Chunk, Citation, Collection, DocumentMeta, User, ChatSession, ChatSessionMessage } from '../types';

export interface SearchOpts {
  userId: string;
  collectionId?: string;
  topK?: number;
}

export interface StorageAdapter {
  // Users
  createUser(user: User, passwordHash: string): Promise<User>;
  getUserByEmail(email: string): Promise<(User & { passwordHash: string }) | null>;
  getUserById(id: string): Promise<User | null>;
  updateUser(userId: string, updates: { name?: string }): Promise<User | null>;

  // Collections
  getCollections(userId: string): Promise<Collection[]>;
  createCollection(c: Collection): Promise<Collection>;
  updateCollection(userId: string, id: string, updates: { name?: string; description?: string }): Promise<Collection | null>;
  deleteCollection(userId: string, id: string): Promise<void>;

  // Documents
  getDocuments(userId: string, collectionId?: string): Promise<DocumentMeta[]>;
  saveDocument(doc: DocumentMeta): Promise<void>;
  deleteDocument(userId: string, id: string): Promise<void>;

  // Chunks
  addChunks(chunks: Chunk[]): Promise<void>;
  getChunks(userId: string, documentId: string): Promise<Chunk[]>;
  search(queryEmbedding: number[], opts: SearchOpts): Promise<Citation[]>;

  // Chat sessions
  getChatSessions(userId: string): Promise<ChatSession[]>;
  createChatSession(session: ChatSession): Promise<ChatSession>;
  updateChatSession(userId: string, sessionId: string, updates: { title?: string; messageCount?: number; updatedAt?: string }): Promise<void>;
  deleteChatSession(userId: string, sessionId: string): Promise<void>;
  getChatMessages(userId: string, sessionId: string): Promise<ChatSessionMessage[]>;
  addChatMessage(msg: ChatSessionMessage): Promise<void>;
}
