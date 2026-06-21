// Shared domain types for DocuMind.

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface DocumentMeta {
  id: string;
  userId: string;
  name: string;
  type: string;
  size: number;
  collectionId: string;
  chunkCount: number;
  status: 'processing' | 'ready' | 'error';
  error?: string;
  createdAt: string;
}

export interface Collection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface Chunk {
  id: string;
  userId: string;
  documentId: string;
  collectionId: string;
  index: number;
  text: string;
  embedding: number[];
}

/** A retrieved chunk plus its similarity score, used as a citation. */
export interface Citation {
  chunkId: string;
  documentId: string;
  documentName: string;
  index: number;
  text: string;
  score: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  createdAt: string;
}
