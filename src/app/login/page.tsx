'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, AlertCircle, Wifi, Clock } from 'lucide-react';

/* Exact replica of Flutter's Icons.medical_services_rounded */
function MedicalServicesIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="white" aria-hidden>
      <path d="M20,6H16V4c0-1.1-0.9-2-2-2h-4C8.9,2,8,2.9,8,4v2H4C2.9,6,2,6.9,2,8v12c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V8C22,6.9,21.1,6,20,6z M14,4h-4v2h4V4z M13,17h-2v-2H9v-2h2v-2h2v2h2v2h-2V17z"/>
    </svg>
  );
}
import { login, roleHome, logout } from '@/lib/auth';

const WEB_ROLES = new Set(['FACILITY_PROVIDER', 'CLINICAL_STAFF', 'SUPERVISOR', 'SYSTEM_ADMIN', 'ADMIN']);

function errorFromException(err: unknown): { message: string; type: 'creds' | 'role' | 'server' | 'network' } {
  const status = (err as { response?: { status?: number } })?.response?.status;
  const code   = (err as { code?: string })?.code;

  if (status === 401) return { message: 'Invalid email or password.', type: 'creds' };
  if (status === 403) return { message: 'Access denied. This dashboard is for clinical staff only.', type: 'role' };
  if (status === 400) return { message: 'Invalid request. Check your credentials.', type: 'server' };
  if (status && status >= 500) return { message: 'Server error. Please try again.', type: 'server' };

  // Timeout — server too slow to respond
  if (code === 'ECONNABORTED' || code === 'ERR_CANCELED') {
    return {
      message: 'Request timed out. The server may be waking up — wait 30 seconds and try again.',
      type: 'network',
    };
  }

  // Connection refused — nothing is listening at the configured URL
  if (code === 'ERR_NETWORK' || code === 'ERR_CONNECTION_REFUSED') {
    const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    return {
      message: isLocal
        ? 'Cannot connect to the backend. Make sure the Spring Boot server is running on port 8080.'
        : 'Cannot reach the server. Check your connection or try again shortly.',
      type: 'network',
    };
  }

  // Fallback (CORS block, DNS failure, etc.)
  return {
    message: 'Cannot reach the server. If this is the first request today, the server may be starting — wait 30 seconds and retry.',
    type: 'network',
  };
}

/* ── ECG heartbeat trace ────────────────────────────────────────────────────── */
function EcgLine() {
  return (
    <svg
      viewBox="0 0 800 72"
      fill="none"
      preserveAspectRatio="none"
      style={{ width: '100%', height: 72, display: 'block' }}
      aria-hidden
    >
      <path
        className="ecg-line"
        d="M-20,36 L80,36 C88,36 90,28 94,28 C98,28 100,36 104,36 L112,36 L116,42 L120,5 L124,67 L128,36 L148,36 C154,36 158,20 163,20 C168,20 172,36 178,36 L260,36
           L360,36 C368,36 370,28 374,28 C378,28 380,36 384,36 L392,36 L396,42 L400,5 L404,67 L408,36 L428,36 C434,36 438,20 443,20 C448,20 452,36 458,36 L540,36
           L640,36 C648,36 650,28 654,28 C658,28 660,36 664,36 L672,36 L676,42 L680,5 L684,67 L688,36 L708,36 C714,36 718,20 723,20 C728,20 732,36 738,36 L820,36"
        stroke="rgba(255,255,255,0.65)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.50"
      />
    </svg>
  );
}



/* ── Page ───────────────────────────────────────────────────────────────────── */
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get('reason') === 'session_expired';

  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [errorType, setErrorType] = useState<'creds' | 'role' | 'server' | 'network' | ''>('');
  const [fails, setFails]         = useState(0);
  const [slowWarning, setSlowWarning] = useState(false);

  const locked = fails >= 3;

  useEffect(() => {
    if (!loading) { setSlowWarning(false); return; }
    const t = setTimeout(() => setSlowWarning(true), 8000);
    return () => clearTimeout(t);
  }, [loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (locked) return;
    setLoading(true); setError(''); setErrorType(''); setSlowWarning(false);
    try {
      const data = await login(email, password);
      if (!WEB_ROLES.has(data.role)) {
        logout();
        setError('This dashboard is for clinical staff only. Patients and CHWs use the mobile app.');
        setErrorType('role');
        return;
      }
      if (data.mustChangePassword) {
        router.push('/change-password');
      } else {
        router.push(roleHome(data.role));
      }
    } catch (err: unknown) {
      const parsed = errorFromException(err);
      setErrorType(parsed.type);
      setError(parsed.message);
      if (parsed.type === 'creds') setFails(f => f + 1);
    } finally {
      setLoading(false);
    }
  }

  const errorBg =
    errorType === 'network' ? { bg: 'rgba(174,114,0,0.08)', border: '#FDE68A', color: '#AE7200' } :
    errorType === 'server'  ? { bg: 'rgba(184,68,0,0.08)',  border: '#FED7AA', color: '#B84400' } :
                              { bg: 'rgba(194,40,40,0.08)', border: '#FECACA', color: '#C22828' };
  const ErrorIcon = errorType === 'network' ? Wifi : errorType === 'server' ? Clock : AlertCircle;

  return (
    <div className="min-h-screen flex" style={{ background: '#8B1A11' }}>

      {/* ── Left panel ──────────────────────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col w-[480px] shrink-0 relative overflow-hidden"
        style={{
          background: 'linear-gradient(175deg, #D12C1F 0%, #8B1A11 100%)',
        }}
      >
        {/* Content — justify-between splits top block from bottom block */}
        <div className="relative flex flex-col flex-1 px-10 pt-10 pb-10 justify-between">

          {/* ── Top block: brand + headline + stats ─────────── */}
          <div>
            {/* Brand */}
            <div className="flex items-center gap-3 mb-10">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                style={{
                  background: 'rgba(255,255,255,0.18)',
                  border: '1.5px solid rgba(255,255,255,0.30)',
                }}
              >
                <MedicalServicesIcon size={22} />
              </div>
              <div>
                <p className="text-white font-bold text-[13px] leading-none tracking-tight">
                  HIV/TB Monitor
                </p>
                <p className="text-[10px] mt-[5px] tracking-wide" style={{ color: 'rgba(255,255,255,0.28)' }}>
                  Clinical Platform · Kigali
                </p>
              </div>
            </div>

            {/* Headline */}
            <p
              className="text-[10px] font-semibold uppercase tracking-widest mb-3"
              style={{ color: 'rgba(255,255,255,0.60)' }}
            >
              Dream Medical Center
            </p>
            <h1
              className="text-white font-bold leading-[1.1] tracking-tight mb-4"
              style={{ fontSize: 34 }}
            >
              Patient<br />Adherence<br />Monitoring
            </h1>
            <p className="text-[14px] leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Real-time HIV &amp; TB treatment oversight
              across community health networks in Rwanda.
            </p>
            <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.28)' }}>
              For clinical staff, supervisors, and system administrators.
              Patients and CHWs access care through the mobile app.
            </p>
          </div>

          {/* ── Bottom block: ECG + features + copyright ─────── */}
          <div>
            {/* ECG strip */}
            <div className="mb-5">
              <p
                className="mb-1.5 text-[9px] uppercase tracking-widest"
                style={{
                  color: 'rgba(255,255,255,0.45)',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                Vital Monitor · ECG
              </p>
              <div style={{
                borderTop: '1px solid rgba(255,255,255,0.08)',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
              }}>
                <EcgLine />
              </div>
            </div>

            {/* Feature list */}
            <ul className="space-y-2 mb-6">
              {[
                'Real-time adherence tracking',
                'AI-powered risk scoring',
                'CHW performance oversight',
                'Treatment interruption tracing & escalation',
                'FHIR-compliant data exchange',
              ].map(f => (
                <li
                  key={f}
                  className="flex items-center gap-2.5 text-[12px]"
                  style={{ color: 'rgba(255,255,255,0.45)' }}
                >
                  <span
                    className="w-1 h-1 rounded-full shrink-0"
                    style={{ background: 'rgba(255,255,255,0.45)' }}
                  />
                  {f}
                </li>
              ))}
            </ul>

            {/* Copyright */}
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.20)' }}>
              © 2026 Dream Medical Center · Rwanda
            </p>
          </div>

        </div>
      </div>

      {/* ── Vertical divider ────────────────────────────────────────────── */}
      <div
        className="hidden lg:block w-px shrink-0"
        style={{ background: 'rgba(255,255,255,0.05)' }}
      />

      {/* ── Right panel ─────────────────────────────────────────────────── */}
      <div
        className="flex-1 flex items-center justify-center px-8 py-12 relative"
        style={{
          background: '#8B1A11',
          backgroundImage: 'radial-gradient(ellipse at 50% 44%, rgba(209,44,31,0.20) 0%, transparent 62%)',
        }}
      >
        <div className="w-full max-w-[460px]">

          {/* Mobile-only logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div
              className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: 'rgba(255,255,255,0.18)',
                border: '1.5px solid rgba(255,255,255,0.30)',
              }}
            >
              <MedicalServicesIcon size={19} />
            </div>
            <span className="font-bold text-[14px] text-white">HIV/TB Monitor</span>
          </div>

          {/* ── Form card ─────────────────────────────────────────────── */}
          <div
            className="bg-white rounded-xl overflow-hidden"
            style={{
              boxShadow: [
                '0 0 0 1px rgba(255,255,255,0.06)',
                '0 8px 24px rgba(0,0,0,0.32)',
                '0 32px 80px rgba(0,0,0,0.44)',
              ].join(', '),
            }}
          >
            {/* Teal accent strip */}
            <div style={{ height: 3, background: 'linear-gradient(90deg, #D12C1F, #F07068 60%, #FDDCDA)' }} />

            <div className="px-8 py-10">
              <div className="mb-8">
                <h2 className="text-[24px] font-bold text-text-primary tracking-tight leading-none">
                  Welcome back
                </h2>
                <p className="text-[14px] text-text-secondary mt-2">
                  Sign in to your clinical dashboard
                </p>
              </div>

              {/* Session expired notice */}
              {sessionExpired && !error && (
                <div
                  className="flex items-start gap-3 rounded-lg p-4 mb-6"
                  style={{ background: 'rgba(41,128,185,0.07)', border: '1px solid #BEE3F8' }}
                >
                  <AlertCircle size={16} className="shrink-0 mt-0.5" style={{ color: '#2980B9' }} />
                  <p className="text-[13px] leading-relaxed" style={{ color: '#1A6A99' }}>
                    Your session expired. Please sign in again.
                  </p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div
                  className="flex items-start gap-3 rounded-lg p-4 mb-6"
                  style={{
                    background: errorBg.bg,
                    border: `1px solid ${errorBg.border}`,
                  }}
                >
                  <ErrorIcon size={16} className="shrink-0 mt-0.5" style={{ color: errorBg.color }} />
                  <p className="text-[13px] leading-relaxed" style={{ color: errorBg.color }}>{error}</p>
                </div>
              )}

              {/* Slow warning */}
              {loading && slowWarning && !error && (
                <div
                  className="flex items-start gap-3 rounded-lg p-4 mb-6"
                  style={{
                    background: 'rgba(174,114,0,0.08)',
                    border: '1px solid #FDE68A',
                  }}
                >
                  <Clock size={16} className="shrink-0 mt-0.5" style={{ color: '#AE7200' }} />
                  <p className="text-[13px]" style={{ color: '#AE7200' }}>
                    Server is starting up — this may take up to 30 seconds.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div>
                  <label className="block text-[12px] font-semibold uppercase tracking-widest text-text-secondary mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-hint pointer-events-none" />
                    <InputField
                      type="email" value={email} onChange={e => setEmail(e.target.value)}
                      required disabled={locked} placeholder="you@facility.rw"
                      className="pl-10 pr-4 py-3"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[12px] font-semibold uppercase tracking-widest text-text-secondary mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-hint pointer-events-none" />
                    <InputField
                      type={showPass ? 'text' : 'password'} value={password}
                      onChange={e => setPassword(e.target.value)}
                      required disabled={locked} placeholder="••••••••"
                      className="pl-10 pr-10 py-3"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-hint hover:text-text-primary transition-colors"
                    >
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Attempts warning */}
                {fails > 0 && !locked && (
                  <p
                    className="text-[11px]"
                    style={{ color: '#AE7200', fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {3 - fails} attempt{3 - fails !== 1 ? 's' : ''} remaining
                  </p>
                )}

                <SubmitButton loading={loading} locked={locked} />
              </form>
            </div>
          </div>

          {/* System status */}
          <div className="flex items-center justify-center gap-2 mt-5">
            <span
              className="w-1.5 h-1.5 rounded-full live-pulse shrink-0"
              style={{ background: '#0C7A4B' }}
            />
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.28)' }}>
              Dream Medical Center · Kigali · All systems operational
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────────────── */

function InputField({
  className = '', ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { className?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      className={`w-full py-2.5 text-[14px] rounded-lg disabled:opacity-50 text-text-primary placeholder:text-text-hint outline-none transition-all ${className}`}
      style={{
        background: focused ? '#fff' : '#FAFAF9',
        border: focused ? '1px solid #D12C1F' : '1px solid #DCECF0',
        boxShadow: focused ? '0 0 0 3px rgba(209,44,31,0.08)' : 'none',
      }}
      onFocus={e => { setFocused(true);  props.onFocus?.(e); }}
      onBlur={e  => { setFocused(false); props.onBlur?.(e);  }}
    />
  );
}

function SubmitButton({ loading, locked }: { loading: boolean; locked: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="submit"
      disabled={loading || locked}
      className="w-full py-2.5 text-white text-[13px] font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
      style={{
        background: hovered && !loading && !locked
          ? '#8B1A11'
          : '#D12C1F',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {loading && (
        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
      )}
      {locked ? 'Account locked' : loading ? 'Signing in…' : 'Sign in'}
    </button>
  );
}
