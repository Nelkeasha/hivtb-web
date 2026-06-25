'use client';
import { useState } from 'react';

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
  name?: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  error?: string;
  span?: boolean;
  max?: string;
  min?: string;
}

/** Shared text/date input used by every form across the app — renders a validation error inline, right under the field, instead of leaving it to a generic top-of-page banner. */
export default function FormField({
  label, value, onChange, name, type = 'text', required = true,
  placeholder = '', hint, error, span, max, min,
}: Props) {
  const [focused, setFocused] = useState(false);
  return (
    <div className={span ? 'col-span-2' : ''}>
      <label className="block text-[11px] font-semibold uppercase tracking-widest text-text-hint mb-1.5">
        {label}{required && <span className="ml-0.5" style={{ color: '#C0392B' }}>*</span>}
      </label>
      <input
        type={type} name={name} value={value} required={required} placeholder={placeholder}
        max={max} min={min}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 text-[13px] rounded-lg bg-white outline-none placeholder:text-text-hint"
        style={{
          border:    error ? '1px solid #C0392B' : focused ? '1px solid #E8714A' : '1px solid #DCECF0',
          boxShadow: focused ? `0 0 0 3px ${error ? 'rgba(194,57,57,0.08)' : 'rgba(232,113,74,0.08)'}` : 'none',
        }}
        onFocus={() => setFocused(true)}
        onBlur={()  => setFocused(false)}
        aria-invalid={!!error}
      />
      {error
        ? <p className="text-[11px] font-medium mt-1.5" style={{ color: '#C0392B' }}>{error}</p>
        : hint && <p className="text-[11px] text-text-hint mt-1.5">{hint}</p>}
    </div>
  );
}
