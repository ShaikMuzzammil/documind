/**
 * JSON file-based StorageAdapter — drop-in replacement for the old json-adapter.
 * Delegates to lib/db-json.ts which has the full working implementation.
 */
import type { StorageAdapter } from './adapter';
import * as impl from '@/lib/db-json';

// Re-export the full implementation as a StorageAdapter-compatible object
const jsonAdapter: StorageAdapter = {
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

export default jsonAdapter;
export * from '@/lib/db-json';
