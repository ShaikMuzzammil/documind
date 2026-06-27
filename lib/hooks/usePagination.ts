'use client';

import { useMemo, useState } from 'react';

export interface PaginationState<T> {
  page:       number;
  pageSize:   number;
  totalPages: number;
  totalItems: number;
  items:      T[];
  hasNext:    boolean;
  hasPrev:    boolean;
  setPage:    (p: number) => void;
  nextPage:   () => void;
  prevPage:   () => void;
  resetPage:  () => void;
}

export function usePagination<T>(allItems: T[], pageSize = 20): PaginationState<T> {
  const [page, setPageRaw] = useState(1);
  const totalItems = allItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const setPage  = (p: number) => setPageRaw(Math.min(Math.max(1, p), totalPages));
  const nextPage = () => setPage(page + 1);
  const prevPage = () => setPage(page - 1);
  const resetPage = () => setPageRaw(1);

  const items = useMemo(() => {
    const start = (page - 1) * pageSize;
    return allItems.slice(start, start + pageSize);
  }, [allItems, page, pageSize]);

  return {
    page, pageSize, totalPages, totalItems, items,
    hasNext: page < totalPages, hasPrev: page > 1,
    setPage, nextPage, prevPage, resetPage,
  };
}
