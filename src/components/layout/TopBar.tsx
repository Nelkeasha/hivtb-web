'use client';
import { useEffect, useRef, useState } from 'react';
import { Bell, AlertTriangle, Info, ChevronDown, LogOut } from 'lucide-react';
import { getUserName, getRole, logout } from '@/lib/auth';
import { useAlertSocket } from '@/hooks/useAlertSocket';
import { timeAgo } from '@/lib/utils';

const ROLE_LABELS: Record<string, string> = {
  CHW:               'CHW',
  FACILITY_PROVIDER: 'Provider',
  CLINICAL_STAFF:    'Clinical Staff',
  SUPERVISOR:        'Supervisor',
  SYSTEM_ADMIN:      'System Admin',
  ADMIN:             'Admin',
};

function computeGreeting(h: number) {
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const SEV_COLOR: Record<string, string> = {
  CRITICAL: '#D32F2F',
  WARNING:  '#F59E0B',
  INFO:     '#1565C0',
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
  const [bellOpen, setBellOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const bellRef  = useRef<HTMLButtonElement>(null);
  const bellDrop = useRef<HTMLDivElement>(null);
  const userRef  = useRef<HTMLButtonElement>(null);
  const userDrop = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (bellDrop.current && !bellDrop.current.contains(e.target as Node) &&
          bellRef.current  && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
      if (userDrop.current && !userDrop.current.contains(e.target as Node) &&
          userRef.current  && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const firstName = fullName ? fullName.split(' ')[0] : '';
  const initials  = fullName ? fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '';
  const roleLabel = ROLE_LABELS[role] ?? role;

  return (
    <header
      className="h-14 flex items-center justify-between px-6 sticky top-0 z-30 bg-white"
      style={{ borderBottom: '1px solid #E9E9E9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
    >
      {/* Left — live indicator + greeting / page title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full live-pulse" style={{ background: '#2E7D32' }} />
          <span className="text-[11px] font-medium" style={{ color: '#9CA3AF' }}>Live</span>
        </div>
        <span className="w-px h-4" style={{ background: '#E9E9E9' }} />
        {title
          ? <h1 className="text-[14px] font-semibold" style={{ color: '#2C2C2C' }}>{title}</h1>
          : <p  className="text-[14px] font-semibold" style={{ color: '#2C2C2C' }}>
              {greet && firstName ? `${greet}, ${firstName}` : ''}
            </p>
        }
      </div>

      {/* Right — date, bell, user */}
      <div className="flex items-center gap-1">
        {date && (
          <span className="data-num text-[11px] mr-2 hidden sm:block" style={{ color: '#9CA3AF' }}>{date}</span>
        )}

        {/* Bell */}
        <div className="relative">
          <button
            ref={bellRef}
            className="relative p-2 rounded-lg transition-colors"
            style={{ background: bellOpen ? '#F9F9F9' : 'transparent' }}
            onClick={() => { if (!bellOpen) clearCount(); setBellOpen(v => !v); setUserOpen(false); }}
            aria-label="Alerts"
          >
            <Bell size={15} style={{ color: '#6B7280' }} />
            {unseenCount > 0 ? (
              <span
                className="absolute top-1 right-1 min-w-[14px] h-3.5 rounded-full flex items-center justify-center data-num text-[9px] font-bold text-white px-0.5"
                style={{ background: '#D32F2F', lineHeight: 1 }}
              >
                {unseenCount > 9 ? '9+' : unseenCount}
              </span>
            ) : (
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full" style={{ background: '#2E7D32' }} />
            )}
          </button>

          {bellOpen && (
            <div
              ref={bellDrop}
              className="absolute right-0 mt-1 w-80 rounded-xl overflow-hidden z-50"
              style={{ top: '100%', border: '1px solid #E9E9E9', background: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
            >
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #F0F0F0' }}>
                <span className="text-[12px] font-semibold" style={{ color: '#2C2C2C' }}>Live Alerts</span>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#2E7D32' }} />
              </div>
              {liveAlerts.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-[12px]" style={{ color: '#9CA3AF' }}>No new alerts yet.</p>
                  <p className="text-[11px] mt-1" style={{ color: '#9CA3AF' }}>Alerts will appear here in real time.</p>
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto">
                  {liveAlerts.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-start gap-3 px-4 py-3 transition-colors cursor-default"
                      style={{ borderBottom: '1px solid #F0F0F0' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#F9F9F9'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = ''; }}
                    >
                      <div className="mt-0.5 shrink-0"><AlertIcon severity={a.severity} /></div>
                      <div className="flex-1 min-w-0">
                        {a.patientName && (
                          <p className="text-[12px] font-semibold truncate" style={{ color: '#2C2C2C' }}>{a.patientName}</p>
                        )}
                        <p className="text-[12px] leading-snug" style={{ color: '#6B7280' }}>{a.title}</p>
                        <p className="data-num text-[10px] mt-0.5" style={{ color: SEV_COLOR[a.severity] ?? '#9CA3AF' }}>
                          {a.severity} · {timeAgo(a.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="px-4 py-2.5 text-center" style={{ borderTop: '1px solid #F0F0F0' }}>
                <a href="/clinical/alerts" className="text-[11px] font-semibold"
                  style={{ color: '#E74A2E' }} onClick={() => setBellOpen(false)}>
                  View all alerts →
                </a>
              </div>
            </div>
          )}
        </div>

        {/* User pill */}
        <div className="relative ml-1">
          <button
            ref={userRef}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors"
            style={{ background: userOpen ? '#F9F9F9' : 'transparent' }}
            onClick={() => { setUserOpen(v => !v); setBellOpen(false); }}
          >
            <div
              className="w-7 h-7 rounded-lg text-white text-[11px] font-bold flex items-center justify-center shrink-0"
              style={{ background: '#E74A2E' }}
            >
              {initials}
            </div>
            <span className="text-[11px] font-semibold hidden md:block" style={{ color: '#6B7280' }}>{roleLabel}</span>
            <ChevronDown
              size={12}
              style={{ color: '#9CA3AF', transform: userOpen ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s' }}
            />
          </button>

          {userOpen && (
            <div
              ref={userDrop}
              className="absolute right-0 mt-1 w-48 rounded-xl overflow-hidden z-50"
              style={{ top: '100%', border: '1px solid #E9E9E9', background: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
            >
              <div className="px-4 py-3" style={{ borderBottom: '1px solid #F0F0F0' }}>
                <p className="text-[13px] font-semibold truncate" style={{ color: '#2C2C2C' }}>{fullName}</p>
                <p className="text-[11px] mt-0.5" style={{ color: '#9CA3AF' }}>{roleLabel}</p>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-medium transition-colors text-left"
                style={{ color: '#6B7280' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = '#F9F9F9';
                  (e.currentTarget as HTMLButtonElement).style.color = '#D32F2F';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = '';
                  (e.currentTarget as HTMLButtonElement).style.color = '#6B7280';
                }}
              >
                <LogOut size={13} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
