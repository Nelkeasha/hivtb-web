'use client';
import { useMemo, useState } from 'react';

export type SortDir = 'asc' | 'desc';

interface UseTableControlsOptions<T> {
  pageSize?: number;
  /** Defaults to plain property access — pass a custom accessor for computed/nested fields. */
  getSortValue?: (item: T, key: string) => string | number | null | undefined;
}

/**
 * Generic client-side sort + paginate for a list already fetched into state.
 * Re-sorts/re-pages on every render from the source array — never mutates it,
 * and clamps the current page automatically when filtering shrinks the list
 * (no separate effect needed to avoid landing on an empty page).
 */
export function useTableControls<T>(data: T[], options: UseTableControlsOptions<T> = {}) {
  const pageSize = options.pageSize ?? 10;
  const getSortValue =
    options.getSortValue ?? ((item: T, key: string) => (item as Record<string, unknown>)[key] as string | number);

  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  }

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    const copy = [...data];
    copy.sort((a, b) => {
      const av = getSortValue(a, sortKey);
      const bv = getSortValue(b, sortKey);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return av - bv;
      return String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' });
    });
    if (sortDir === 'desc') copy.reverse();
    return copy;
  }, [data, sortKey, sortDir, getSortValue]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paged = useMemo(
    () => sorted.slice((safePage - 1) * pageSize, safePage * pageSize),
    [sorted, safePage, pageSize],
  );

  return {
    paged,
    sortKey,
    sortDir,
    toggleSort,
    page: safePage,
    setPage,
    totalPages,
    totalItems: sorted.length,
    pageSize,
  };
}
