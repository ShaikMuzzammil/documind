'use client';

import { useCallback, useEffect, useState } from 'react';

export interface MeUser { id: string; name: string; email: string; }

let _cache: MeUser | null | undefined = undefined; // undefined = not yet fetched
const listeners = new Set<() => void>();

function notify() { listeners.forEach((fn) => fn()); }

export function useUser() {
  const [user,    setUser]    = useState<MeUser | null | undefined>(_cache);
  const [loading, setLoading] = useState(_cache === undefined);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/me');
      if (res.ok) {
        const data = await res.json();
        _cache = data.user ?? null;
      } else {
        _cache = null;
      }
    } catch {
      _cache = null;
    }
    setUser(_cache ?? null);
    setLoading(false);
    notify();
  }, []);

  useEffect(() => {
    const sync = () => setUser(_cache ?? null);
    listeners.add(sync);
    if (_cache === undefined) refresh();
    else setLoading(false);
    return () => { listeners.delete(sync); };
  }, [refresh]);

  return { user: user ?? null, loading, refresh };
}
