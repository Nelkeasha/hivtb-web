'use client';
import { useEffect, useRef, useState } from 'react';
import { Bell, AlertTriangle, Info } from 'lucide-react';
import { getUserName, getRole } from '@/lib/auth';
import { useAlertSocket } from '@/hooks/useAlertSocket';
import { timeAgo } from '@/lib/utils';

const ROLE_LABELS: Record<string, string> = {
  CHW:               'CHW',
  FACILITY_PROVIDER: 'Provider',
  CLINICAL_STAFF:    'Clinical',
  SUPERVISOR:        'Supervisor',
  SYSTEM_ADMIN:      'Admin',
  ADMIN:             'Admin',
};

function computeGreeting(h: number) {
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

const SEV_COLOR: Record<string, string> = {
  CRITICAL: '#C0392B',
  WARNING:  '#F39C12',
  INFO:     '#2980B9',
};

function AlertIcon({ severity }: { severity: string }) {
  const color = SEV_COLOR[severity] ?? SEV_COLOR.INFO;
  if (severity === 'CRITICAL') return <AlertTriangle size={12} style={{ color }} />;
  if (severity === 'WARNING')  return <Bell          size={12} style={{ color }} />;
  return                              <Info          size={12} style={{ color }} />;
}

export default function TopBar({ title }: { title?: string }) {
  const [fullName, setFullName] = useState('');
  const [role, setRole]         = useState('');
  const [date, setDate]         = useState('');
  const [greet, setGreet]       = useState('');
  const [dropOpen, setDropOpen] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const { liveAlerts, unseenCount, clearCount } = useAlertSocket();

  useEffect(() => {
    const name = getUserName();
    const r    = getRole() ?? '';
    const now  = new Date();
    setFullName(name);
    setRole(r);
    setDate(now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }));
    setGreet(computeGreeting(now.getHours()));
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropRef.current && !dropRef.current.contains(e.target as Node) &&
        bellRef.current && !bellRef.current.contains(e.target as Node)
      ) {
        setDropOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function toggleDrop() {
    if (!dropOpen) clearCount();
    setDropOpen((v) => !v);
  }

  const firstName = fullName ? fullName.split(' ')[0] : '';
  const initials  = fullName ? fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '';
  const roleLabel = ROLE_LABELS[role] ?? role;

  return (
    <header
      className="h-14 flex items-center justify-between px-6 sticky top-0 z-30"
      style={{ background: '#fff', borderBottom: '1px solid #DCECF0' }}
    >
      {/* Left — live indicator + page title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full live-pulse" style={{ background: '#27AE60' }} />
          <span className="text-[11px] text-text-hint font-medium">Live</span>
        </div>

        <span className="w-px h-4" style={{ background: '#DCECF0' }} />

        {title
          ? <h1 className="text-[14px] font-semibold text-text-primary">{title}</h1>
          : <p className="text-[14px] font-semibold text-text-primary">
              {greet ? `Good ${greet}, ${firstName}` : ''}
            </p>
        }
      </div>

      {/* Right — date, bell, user */}
      <div className="flex items-center gap-2">

        {/* Date */}
        {date && (
          <span className="data-num text-[11px] text-text-hint mr-1 hidden sm:block">
            {date}
          </span>
        )}

        {/* Bell — with live badge and dropdown */}
        <div className="relative">
          <button
            ref={bellRef}
            className="relative p-2 rounded-lg transition-colors"
            style={{ background: dropOpen ? '#F5FAFB' : 'transparent' }}
            onClick={toggleDrop}
            aria-label="Alerts"
          >
            <Bell size={15} className="text-text-secondary" />
            {unseenCount > 0 ? (
              <span
                className="absolute top-1 right-1 min-w-[14px] h-3.5 rounded-full flex items-center justify-center data-num text-[9px] font-bold text-white px-0.5"
                style={{ background: '#C0392B', lineHeight: 1 }}
              >
                {unseenCount > 9 ? '9+' : unseenCount}
              </span>
            ) : (
              <span
                className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full"
                style={{ background: '#C0392B' }}
              />
            )}
          </button>

          {/* Dropdown panel */}
          {dropOpen && (
            <div
              ref={dropRef}
              className="absolute right-0 mt-1 w-80 rounded-xl overflow-hidden shadow-lg z-50"
              style={{ top: '100%', border: '1px solid #DCECF0', background: '#fff' }}
            >
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: '1px solid #E8F4F8' }}
              >
                <span className="text-[12px] font-semibold text-text-primary">
                  Live Alerts
                </span>
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: '#27AE60' }}
                />
              </div>

              {liveAlerts.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-[12px] text-text-hint">No new alerts yet.</p>
                  <p className="text-[11px] text-text-hint mt-1">
                    Alerts will appear here in real time.
                  </p>
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto">
                  {liveAlerts.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-start gap-3 px-4 py-3 transition-colors"
                      style={{ borderBottom: '1px solid #E8F4F8' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#F5FAFB'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = ''; }}
                    >
                      <div className="mt-0.5 shrink-0">
                        <AlertIcon severity={a.severity} />
                      </div>
                      <div className="flex-1 min-w-0">
                        {a.patientName && (
                          <p className="text-[12px] font-semibold text-text-primary truncate">
                            {a.patientName}
                          </p>
                        )}
                        <p className="text-[12px] text-text-secondary leading-snug">
                          {a.title}
                        </p>
                        <p
                          className="data-num text-[10px] mt-0.5"
                          style={{ color: SEV_COLOR[a.severity] ?? '#AAB4BC' }}
                        >
                          {a.severity} · {timeAgo(a.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div
                className="px-4 py-2.5 text-center"
                style={{ borderTop: '1px solid #E8F4F8' }}
              >
                <a
                  href="/clinical/alerts"
                  className="text-[11px] font-semibold transition-colors"
                  style={{ color: '#D12C1F' }}
                  onClick={() => setDropOpen(false)}
                >
                  View all alerts →
                </a>
              </div>
            </div>
          )}
        </div>

        {/* User avatar + role */}
        <div className="flex items-center gap-2 ml-1">
          <div
            className="w-7 h-7 rounded-lg text-white text-[11px] font-bold flex items-center justify-center shrink-0"
            style={{ background: '#D12C1F' }}
          >
            {initials}
          </div>
          {roleLabel && (
            <span className="text-[10px] font-semibold uppercase tracking-widest text-text-hint hidden md:block">
              {roleLabel}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
