'use client';
import { ArrowUpDown } from 'lucide-react';
import type { SortDir } from '@/lib/useTableControls';

interface Option {
  key: string;
  label: string;
}

interface Props {
  options: Option[];
  sortKey: string | null;
  sortDir: SortDir;
  onChange: (key: string) => void;
}

/** Sort control for card-list pages that have no table header to click — e.g. Alerts, Referrals. */
export default function SortSelect({ options, sortKey, sortDir, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown size={13} className="text-text-hint" />
      <select
        value={sortKey ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="text-[12px] font-medium text-text-secondary bg-white rounded-lg px-2.5 py-1.5 outline-none cursor-pointer"
        style={{ border: '1px solid #DCECF0' }}
      >
        <option value="">Sort by…</option>
        {options.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}{sortKey === o.key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
          </option>
        ))}
      </select>
    </div>
  );
}
