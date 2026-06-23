'use client';

import { useCallback, useEffect, useState } from 'react';
import { Collection } from './types';

export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/collections');
      const data = await res.json();
      setCollections(data.collections || []);
    } catch {
      setCollections([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (name: string, description?: string) => {
    const res = await fetch('/api/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    });
    if (res.ok) await refresh();
    return res.ok;
  }, [refresh]);

  const update = useCallback(async (id: string, patch: { name?: string; description?: string }) => {
    const res = await fetch(`/api/collections/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (res.ok) await refresh();
    return res.ok;
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    const res = await fetch(`/api/collections/${id}`, { method: 'DELETE' });
    if (res.ok) await refresh();
    return res.ok;
  }, [refresh]);

  return { collections, loading, refresh, create, update, remove };
}
