'use client';

import { useCallback, useEffect, useState } from 'react';
import { User } from './types';

interface MeResponse {
  user: User;
  capabilities: {
    email: boolean;
    postgres: boolean;
    ai: boolean;
  };
}

export function useUser() {
  const [data, setData] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/me');
      if (!res.ok) {
        setData(null);
        return;
      }
      setData(await res.json());
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...data, loading, refresh };
}
