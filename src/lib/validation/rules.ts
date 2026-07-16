/**
 * Single source of truth for input-format rules on the web client. Mirrors
 * the backend's com.nelly.hivtbmonitoringsystem.validation package exactly
 * (same regex, same messages) so a value accepted/rejected here is
 * accepted/rejected identically by the API — the web layer only exists to
 * give the user feedback before they submit; the backend remains the real
 * gate against bad data. Keep both in sync if a rule changes.
 *
 * Every validator returns `null` when the value is valid, or a clear,
 * actionable error message when it isn't.
 */

export const PATTERNS = {
  /** Rwanda mobile number: 10 digits starting with 07, or +250 followed by 7 and 8 digits. */
  RWANDA_PHONE: /^(07\d{8}|\+2507\d{8})$/,
  /** Rwanda national ID: exactly 16 digits. */
  RWANDA_NATIONAL_ID: /^\d{16}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  EMPLOYEE_CODE: /^[A-Za-z0-9-]{3,50}$/,
};

export function required(value: string | null | undefined, label: string): string | null {
  if (value == null || value.trim() === '') return `${label} is required`;
  return null;
}

export function maxLength(value: string | null | undefined, max: number, label: string): string | null {
  if (value && value.length > max) return `${label} must be at most ${max} characters`;
  return null;
}

export function phone(value: string | null | undefined, opts: { required?: boolean } = {}): string | null {
  const v = (value ?? '').trim();
  if (!v) return opts.required ? 'Phone number is required' : null;
  if (!PATTERNS.RWANDA_PHONE.test(v)) {
    return 'Phone number must be 10 digits starting with 07 (e.g. 0788123456), or start with +250';
  }
  return null;
}

export function nationalId(value: string | null | undefined, opts: { required?: boolean } = {}): string | null {
  const v = (value ?? '').trim();
  if (!v) return opts.required ? 'National ID is required' : null;
  if (!PATTERNS.RWANDA_NATIONAL_ID.test(v)) return 'National ID must be exactly 16 digits';
  return null;
}

export function email(value: string | null | undefined, opts: { required?: boolean } = {}): string | null {
  const v = (value ?? '').trim();
  if (!v) return opts.required ? 'Email address is required' : null;
  if (!PATTERNS.EMAIL.test(v)) return 'Please enter a valid email address (e.g. name@example.com)';
  return null;
}

export function employeeCode(value: string | null | undefined): string | null {
  const v = (value ?? '').trim();
  if (!v) return 'Employee code is required';
  if (!PATTERNS.EMPLOYEE_CODE.test(v)) return 'Employee code may only contain letters, numbers, and hyphens (3-50 characters)';
  return null;
}

export function dateNotFuture(value: string | null | undefined, label: string, opts: { required?: boolean } = {}): string | null {
  const v = (value ?? '').trim();
  if (!v) return opts.required ? `${label} is required` : null;
  const date = new Date(v);
  if (Number.isNaN(date.getTime())) return `${label} is not a valid date`;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (date.getTime() > today.getTime()) return `${label} cannot be in the future`;
  return null;
}

export function dateNotPast(value: string | null | undefined, label: string, opts: { required?: boolean } = {}): string | null {
  const v = (value ?? '').trim();
  if (!v) return opts.required ? `${label} is required` : null;
  const date = new Date(v);
  if (Number.isNaN(date.getTime())) return `${label} is not a valid date`;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date.getTime() < today.getTime()) return `${label} cannot be in the past`;
  return null;
}

export function dateRangeOrder(start: string | null | undefined, end: string | null | undefined, label = 'End date'): string | null {
  if (!start || !end) return null;
  if (new Date(end).getTime() < new Date(start).getTime()) return `${label} cannot be before the start date`;
  return null;
}

export function numberRange(value: number | null | undefined, min: number, max: number, label: string): string | null {
  if (value == null || Number.isNaN(value)) return null;
  if (value < min || value > max) return `${label} must be between ${min} and ${max}`;
  return null;
}

export function oneOf(value: string | null | undefined, options: string[], label: string, opts: { required?: boolean } = {}): string | null {
  const v = (value ?? '').trim();
  if (!v) return opts.required ? `${label} is required` : null;
  if (!options.includes(v)) return `${label} must be one of: ${options.join(', ')}`;
  return null;
}

/** Mirrors backend's ChangePasswordRequest: min 8 chars, at least one uppercase letter, at least one digit. */
export function password(value: string | null | undefined): string | null {
  const v = value ?? '';
  if (!v) return 'New password is required';
  if (v.length < 8) return 'New password must be at least 8 characters';
  if (!/[A-Z]/.test(v)) return 'New password must contain at least one uppercase letter';
  if (!/[0-9]/.test(v)) return 'New password must contain at least one digit';
  return null;
}

export function passwordsMatch(value: string | null | undefined, other: string | null | undefined, label = 'Passwords'): string | null {
  if (!value) return null;
  if (value !== other) return `${label} do not match`;
  return null;
}

/**
 * Runs every validator function in `schema` against the matching key in
 * `values`. Each schema entry is a list of `(value) => string | null`
 * functions — the first non-null result wins for that field. Returns a
 * field → message map containing only the fields that failed, so callers
 * can spread it directly into per-field error state.
 */
export function validateForm<T extends Record<string, unknown>>(
  values: T,
  schema: Partial<Record<keyof T, Array<(value: unknown) => string | null>>>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of Object.keys(schema) as Array<keyof T>) {
    const validators = schema[field] ?? [];
    for (const validate of validators) {
      const message = validate(values[field]);
      if (message) {
        errors[field as string] = message;
        break;
      }
    }
  }
  return errors;
}
