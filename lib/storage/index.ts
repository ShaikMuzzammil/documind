// Storage selector: Postgres when DATABASE_URL is set, else JSON file store.

import { StorageAdapter } from './adapter';
import { JsonAdapter } from './json-adapter';
import { PostgresAdapter } from './postgres-adapter';

let instance: StorageAdapter | null = null;

export function getStorage(): StorageAdapter {
  if (instance) return instance;
  instance = process.env.DATABASE_URL ? new PostgresAdapter() : new JsonAdapter();
  return instance;
}

export function usingPostgres(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export type { StorageAdapter, SearchOpts } from './adapter';
