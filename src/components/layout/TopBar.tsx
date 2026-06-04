'use client';
import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { getUserName, getRole } from '@/lib/auth';

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

export default function TopBar({ title }: { title?: string }) {
  const [bellHovered, setBellHovered] = useState(false);

  // All cookie-reads and Date calls deferred to the client to avoid hydration mismatch
  const [fullName, setFullName]   = useState('');
  const [role, setRole]           = useState('');
  const [date, setDate]           = useState('');
  const [greet, setGreet]         = useState('');

  useEffect(() => {
    const name = getUserName();
    const r    = getRole() ?? '';
    const now  = new Date();
    setFullName(name);
    setRole(r);
    setDate(now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }));
    setGreet(computeGreeting(now.getHours()));
  }, []);

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

        {/* Bell */}
        <button
          className="relative p-2 rounded-lg transition-colors"
          style={{ background: bellHovered ? '#F5FAFB' : 'transparent' }}
          onMouseEnter={() => setBellHovered(true)}
          onMouseLeave={() => setBellHovered(false)}
        >
          <Bell size={15} className="text-text-secondary" />
          <span
            className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full"
            style={{ background: '#C0392B' }}
          />
        </button>

        {/* User avatar + role */}
        <div className="flex items-center gap-2 ml-1">
          <div
            className="w-7 h-7 rounded-lg text-white text-[11px] font-bold flex items-center justify-center shrink-0"
            style={{ background: '#006D77' }}
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
