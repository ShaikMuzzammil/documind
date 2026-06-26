export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface Collection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
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

export interface Chunk {
  id: string;
  documentId: string;
  userId: string;
  collectionId: string;
  text: string;
  embedding: number[];
  index: number;
}

export interface Citation {
  chunkId: string;
  documentId: string;
  documentName: string;
  text: string;
  score: number;
  index: number;
  page?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  createdAt: string;
}

export interface SchemaField {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  description?: string;
}

export interface UserSettings {
  responseStyle: 'concise' | 'balanced' | 'detailed';
  citationCount: number;
  defaultCollection?: string;
  itemsPerPage: number;
  emailNotifications: boolean;
}
