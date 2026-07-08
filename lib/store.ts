// Thin facade over the active storage adapter.
// All other code imports from here — never from individual adapters directly.

import { getStorage } from './storage/index';
import { Chunk, Collection, DocumentMeta, User, ChatSession, ChatSessionMessage } from './types';
import { SearchOpts } from './storage/adapter';

export async function createUser(user: User, passwordHash: string) {
  return (await getStorage()).createUser(user, passwordHash);
}
export async function getUserByEmail(email: string) {
  return (await getStorage()).getUserByEmail(email);
}
export async function getUserById(id: string) {
  return (await getStorage()).getUserById(id);
}
export async function updateUser(userId: string, updates: { name?: string }) {
  return (await getStorage()).updateUser(userId, updates);
}

export async function getCollections(userId: string) {
  return (await getStorage()).getCollections(userId);
}
export async function createCollection(c: Collection) {
  return (await getStorage()).createCollection(c);
}
export async function updateCollection(userId: string, id: string, updates: { name?: string; description?: string }) {
  return (await getStorage()).updateCollection(userId, id, updates);
}
export async function deleteCollection(userId: string, id: string) {
  return (await getStorage()).deleteCollection(userId, id);
}

export async function getDocuments(userId: string, collectionId?: string) {
  return (await getStorage()).getDocuments(userId, collectionId);
}
export async function saveDocument(doc: DocumentMeta) {
  return (await getStorage()).saveDocument(doc);
}
export async function deleteDocument(userId: string, id: string) {
  return (await getStorage()).deleteDocument(userId, id);
}

export async function addChunks(chunks: Chunk[]) {
  return (await getStorage()).addChunks(chunks);
}
export async function getChunks(userId: string, documentId: string) {
  return (await getStorage()).getChunks(userId, documentId);
}
export async function search(queryEmbedding: number[], opts: SearchOpts) {
  return (await getStorage()).search(queryEmbedding, opts);
}

// Chat sessions
export async function getChatSessions(userId: string) {
  return (await getStorage()).getChatSessions(userId);
}
export async function createChatSession(session: ChatSession) {
  return (await getStorage()).createChatSession(session);
}
export async function updateChatSession(userId: string, sessionId: string, updates: { title?: string; messageCount?: number; updatedAt?: string }) {
  return (await getStorage()).updateChatSession(userId, sessionId, updates);
}
export async function deleteChatSession(userId: string, sessionId: string) {
  return (await getStorage()).deleteChatSession(userId, sessionId);
}
export async function getChatMessages(userId: string, sessionId: string) {
  return (await getStorage()).getChatMessages(userId, sessionId);
}
export async function addChatMessage(msg: ChatSessionMessage) {
  return (await getStorage()).addChatMessage(msg);
}
