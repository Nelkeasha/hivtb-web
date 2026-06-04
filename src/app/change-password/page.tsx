'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { getRole, roleHome, logout } from '@/lib/auth';
export default function ChangePasswordPage() {
  const router = useRouter();
  const [current, setCurrent] = useState('');
  const [next, setNext]       = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [done, setDone]       = useState(false);

  const mismatch = confirm !== '' && confirm !== next;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) { setError('New passwords do not match.'); return; }
    if (next.length < 8)  { setError('Password must be at least 8 characters.'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/api/auth/change-password', {
        currentPassword: current,
        newPassword: next,
      });
      setDone(true);
      setTimeout(() => router.push(roleHome(getRole() ?? '')), 2000);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setError(status === 401 ? 'Current password is incorrect.' : 'Failed to change password. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: '#EDF6F9' }}
    >
      <div className="w-full max-w-[460px]">

        {/* Brand mark */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: '#006D77' }}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
              <path d="M7.5 2v11M2 7.5h11" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-bold text-text-primary leading-none">HIV/TB Monitor</p>
            <p className="text-[11px] text-text-hint mt-0.5">Dream Medical Center</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #DCECF0' }}>
          <div style={{ height: 3, background: done ? '#27AE60' : '#006D77' }} />

          <div className="px-8 py-8">
            {done ? (
              /* ── Success state ────────────────────────── */
              <div className="text-center py-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
                  style={{ background: 'rgba(12,122,75,0.10)' }}
                >
                  <CheckCircle2 size={28} style={{ color: '#27AE60' }} />
                </div>
                <h2 className="text-[18px] font-bold text-text-primary tracking-tight">
                  Password changed
                </h2>
                <p className="text-[13px] text-text-hint mt-2">
                  Redirecting to your dashboard…
                </p>
                <div className="mt-5 flex justify-center">
                  <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#27AE60', borderTopColor: 'transparent' }} />
                </div>
              </div>
            ) : (
              /* ── Form ─────────────────────────────────── */
              <>
                <div className="mb-6">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-text-hint mb-1">
                    Security
                  </p>
                  <h2 className="text-[20px] font-bold text-text-primary tracking-tight leading-none">
                    Change Password
                  </h2>
                  <p className="text-[13px] text-text-hint mt-1.5">
                    You must set a new password before continuing.
                  </p>
                </div>

                {error && (
                  <div
                    className="flex items-start gap-2.5 rounded-lg p-3 mb-5"
                    style={{ background: 'rgba(194,40,40,0.04)', border: '1px solid #FECACA' }}
                  >
                    <AlertCircle size={13} className="shrink-0 mt-0.5" style={{ color: '#C0392B' }} />
                    <p className="text-[12px] font-medium" style={{ color: '#C0392B' }}>{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">

                  {/* Current password */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-widest text-text-hint mb-1.5">
                      Current Password
                    </label>
                    <PasswordInput
                      value={current}
                      onChange={setCurrent}
                      show={showCur}
                      onToggleShow={() => setShowCur(!showCur)}
                      placeholder="••••••••"
                    />
                  </div>

                  {/* New password */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-widest text-text-hint mb-1.5">
                      New Password
                    </label>
                    <PasswordInput
                      value={next}
                      onChange={setNext}
                      show={showNew}
                      onToggleShow={() => setShowNew(!showNew)}
                      placeholder="Min. 8 characters"
                      minLength={8}
                    />
                  </div>

                  {/* Confirm */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-widest text-text-hint mb-1.5">
                      Confirm New Password
                    </label>
                    <PasswordInput
                      value={confirm}
                      onChange={setConfirm}
                      placeholder="••••••••"
                      mismatch={mismatch}
                    />
                    {mismatch && (
                      <p className="text-[11px] mt-1.5" style={{ color: '#C0392B' }}>
                        Passwords do not match
                      </p>
                    )}
                  </div>

                  <SubmitButton loading={loading} />
                </form>

                <button
                  onClick={logout}
                  className="w-full mt-4 text-[12px] text-text-hint transition-colors"
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#5A6474'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#AAB4BC'; }}
                >
                  Sign out instead
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PasswordInput({
  value, onChange, show, onToggleShow, placeholder, minLength, mismatch = false,
}: {
  value: string;
  onChange: (v: string) => void;
  show?: boolean;
  onToggleShow?: () => void;
  placeholder?: string;
  minLength?: number;
  mismatch?: boolean;
}) {
  const [focused, setFocused] = useState(false);

  const borderColor = focused
    ? '#006D77'
    : mismatch
    ? '#C0392B'
    : '#DCECF0';

  const shadow = focused
    ? '0 0 0 3px rgba(0,95,107,0.08)'
    : mismatch
    ? '0 0 0 3px rgba(194,40,40,0.08)'
    : 'none';

  return (
    <div className="relative">
      <Lock
        size={13}
        className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-hint"
      />
      <input
        type={show === false || show === undefined && onToggleShow === undefined ? 'password' : show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        minLength={minLength}
        placeholder={placeholder}
        className="w-full py-2.5 text-[13px] rounded-lg bg-white outline-none placeholder:text-text-hint"
        style={{
          paddingLeft: '2.25rem',
          paddingRight: onToggleShow ? '2.5rem' : '0.75rem',
          border: `1px solid ${borderColor}`,
          boxShadow: shadow,
        }}
        onFocus={() => setFocused(true)}
        onBlur={()  => setFocused(false)}
      />
      {onToggleShow && (
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-hint hover:text-text-secondary transition-colors"
        >
          {show ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
      )}
    </div>
  );
}

function SubmitButton({ loading }: { loading: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full py-2.5 text-white text-[13px] font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
      style={{ background: hovered && !loading ? '#004E57' : '#006D77' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {loading && (
        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
      )}
      {loading ? 'Saving…' : 'Change Password'}
    </button>
  );
}
