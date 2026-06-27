/**
 * PostgreSQL StorageAdapter — delegates to lib/db-postgres.ts.
 */
import type { StorageAdapter } from './adapter';
import * as impl from '@/lib/db-postgres';

const postgresAdapter: StorageAdapter = {
  getUser:          impl.getUser,
  getUserByEmail:   impl.getUserByEmail,
  saveUser:         impl.saveUser,
  updateUser:       impl.updateUser,
  getCollections:   impl.getCollections,
  getCollection:    impl.getCollection,
  saveCollection:   impl.saveCollection,
  updateCollection: impl.updateCollection,
  deleteCollection: impl.deleteCollection,
  getDocuments:     impl.getDocuments,
  getDocument:      impl.getDocument,
  saveDocument:     impl.saveDocument,
  deleteDocument:   impl.deleteDocument,
  addChunks:        impl.addChunks,
  deleteChunks:     impl.deleteChunks,
  search:           impl.search,
};

export default postgresAdapter;
export * from '@/lib/db-postgres';
