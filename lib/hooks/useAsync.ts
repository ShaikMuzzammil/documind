'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface AsyncState<T> {
  data:    T | null;
  loading: boolean;
  error:   string;
  execute: (...args: Parameters<() => Promise<T>>) => Promise<void>;
  reset:   () => void;
}

export function useAsync<T>(
  fn: () => Promise<T>,
  immediate = false,
): AsyncState<T> {
  const [data,    setData]    = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const execute = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const result = await fn();
      if (mounted.current) setData(result);
    } catch (err) {
      if (mounted.current) setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [fn]);

  useEffect(() => { if (immediate) execute(); }, [execute, immediate]);

  const reset = useCallback(() => { setData(null); setError(''); setLoading(false); }, []);

  return { data, loading, error, execute, reset };
}
