'use client';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  label: string;
  sortKey: string;
  activeSortKey: string | null;
  sortDir: 'asc' | 'desc';
  onSort: (key: string) => void;
  className?: string;
}

export default function SortableTh({ label, sortKey, activeSortKey, sortDir, onSort, className }: Props) {
  const active = activeSortKey === sortKey;
  return (
    <th
      onClick={() => onSort(sortKey)}
      className={cn(
        'pb-3 pr-6 text-left text-[11px] font-semibold uppercase tracking-widest cursor-pointer select-none transition-colors',
        active ? 'text-primary' : 'text-text-hint hover:text-text-secondary',
        className,
      )}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active ? (
          sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
        ) : (
          <ChevronsUpDown size={12} className="opacity-40" />
        )}
      </span>
    </th>
  );
}
