'use client';
import { useState } from 'react';

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
  error?: string;
}

/** Shared dropdown used by every form across the app — same inline-error treatment as FormField. */
export default function FormSelect({ label, value, onChange, required = true, children, hint, error }: Props) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-widest text-text-hint mb-1.5">
        {label}{required && <span className="ml-0.5" style={{ color: '#C0392B' }}>*</span>}
      </label>
      <select
        value={value} required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 text-[13px] rounded-lg bg-white outline-none"
        style={{
          border:    error ? '1px solid #C0392B' : focused ? '1px solid #D9643A' : '1px solid #E9E9E9',
          boxShadow: focused ? `0 0 0 3px ${error ? 'rgba(194,57,57,0.08)' : 'rgba(217,100,58,0.08)'}` : 'none',
        }}
        onFocus={() => setFocused(true)}
        onBlur={()  => setFocused(false)}
        aria-invalid={!!error}
      >
        {children}
      </select>
      {error
        ? <p className="text-[11px] font-medium mt-1.5" style={{ color: '#C0392B' }}>{error}</p>
        : hint && <p className="text-[11px] text-text-hint mt-1.5">{hint}</p>}
    </div>
  );
}
