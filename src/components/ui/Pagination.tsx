'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  /** Pass "-mx-6 -mb-6 mt-4" (or similar) when nesting inside a Card to break out of its padding and sit flush. */
  className?: string;
}

export default function Pagination({ page, totalPages, totalItems, pageSize, onPageChange, className }: Props) {
  if (totalItems === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div
      className={cn('flex items-center justify-between px-6 py-3 flex-wrap gap-2', className)}
      style={{ borderTop: '1px solid #E8F4F8' }}
    >
      <p className="text-[12px] text-text-hint">
        Showing <span className="data-num font-semibold text-text-secondary">{start}–{end}</span> of{' '}
        <span className="data-num font-semibold text-text-secondary">{totalItems}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex items-center justify-center w-7 h-7 rounded-md text-text-secondary hover:bg-background disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={15} />
        </button>
        <span className="text-[12px] text-text-secondary px-2 data-num">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="flex items-center justify-center w-7 h-7 rounded-md text-text-secondary hover:bg-background disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
