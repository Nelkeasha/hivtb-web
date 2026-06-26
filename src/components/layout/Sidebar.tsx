'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout, getUserName, getRole } from '@/lib/auth';
import {
  LayoutDashboard, Users, AlertCircle, FileText, ArrowLeftRight,
  BarChart3, UserCheck, LogOut, History, Settings, PersonStanding,
} from 'lucide-react';

interface NavItem { href: string; label: string; icon: React.ElementType; }

const clinicalNav: NavItem[] = [
  { href: '/clinical',           label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clinical/patients',  label: 'Patients',  icon: Users           },
  { href: '/clinical/alerts',    label: 'Alerts',    icon: AlertCircle     },
  { href: '/clinical/referrals', label: 'Referrals', icon: ArrowLeftRight  },
  { href: '/clinical/reports',   label: 'Reports',   icon: FileText        },
];

const supervisorNav: NavItem[] = [
  { href: '/supervisor',           label: 'Overview',               icon: LayoutDashboard },
  { href: '/supervisor/chw',       label: 'CHW Team',               icon: UserCheck       },
  { href: '/supervisor/ltfu',      label: 'Treatment Interruptions', icon: PersonStanding  },
  { href: '/supervisor/analytics', label: 'Analytics',              icon: BarChart3       },
  { href: '/supervisor/alerts',    label: 'Alerts',                 icon: AlertCircle     },
  { href: '/supervisor/reports',   label: 'Reports',                icon: FileText        },
];

const adminNav: NavItem[] = [
  { href: '/admin',          label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users',    label: 'Users',     icon: Users           },
  { href: '/admin/audit',    label: 'Audit Log', icon: History         },
  { href: '/admin/settings', label: 'Settings',  icon: Settings        },
];

const ROLE_LABELS: Record<string, string> = {
  CHW:               'Community Health Worker',
  FACILITY_PROVIDER: 'Facility Provider',
  CLINICAL_STAFF:    'Clinical Staff',
  SUPERVISOR:        'Supervisor',
  SYSTEM_ADMIN:      'System Admin',
  ADMIN:             'Administrator',
};

const SECTION_LABELS: Record<string, string> = {
  SUPERVISOR:   'Supervision',
  SYSTEM_ADMIN: 'Administration',
  ADMIN:        'Administration',
};

function navByRole(role: string | undefined): NavItem[] {
  if (role === 'SUPERVISOR')                        return supervisorNav;
  if (role === 'SYSTEM_ADMIN' || role === 'ADMIN') return adminNav;
  return clinicalNav;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [name, setName] = useState('');
  const [role, setRole] = useState<string | undefined>(undefined);

  useEffect(() => {
    setName(getUserName());
    setRole(getRole() ?? undefined);
  }, []);

  const nav       = navByRole(role);
  const initials  = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '';
  const section   = role ? (SECTION_LABELS[role] ?? 'Clinical') : 'Clinical';
  const roleLabel = role ? (ROLE_LABELS[role] ?? role.replace(/_/g, ' ')) : '';

  return (
    <aside
      className="fixed inset-y-0 left-0 w-[220px] flex flex-col z-40"
      style={{ background: 'linear-gradient(180deg, #E74A2E 0%, #853C30 100%)', boxShadow: '2px 0 12px rgba(0,0,0,0.10)' }}
    >
      {/* ── Brand header — DMC logo ───────────────────────── */}
      <div className="px-4 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.97)' }}>
        <Image
          src="/dmc-logo.png"
          alt="Dream Medical Center"
          width={160}
          height={66}
          priority
          style={{ objectFit: 'contain', width: '160px', height: 'auto' }}
        />
        <p className="text-[9.5px] font-semibold uppercase tracking-[0.10em] mt-2 px-0.5"
          style={{ color: '#853C30' }}>
          HIV/TB Monitoring System
        </p>
      </div>

      {/* ── Navigation ───────────────────────────────────── */}
      <nav className="flex-1 px-3 pt-5 pb-3 space-y-[1px] overflow-y-auto">
        <p
          className="text-[9px] font-bold uppercase tracking-[0.12em] px-3 mb-3"
          style={{ color: 'rgba(255,255,255,0.50)' }}
        >
          {section}
        </p>

        {nav.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== '/clinical' && href !== '/supervisor' && href !== '/admin' &&
             pathname.startsWith(href));

          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] font-medium transition-all"
              style={active
                ? { background: 'rgba(255,255,255,0.20)', color: '#fff', fontWeight: 600 }
                : { color: 'rgba(255,255,255,0.68)' }
              }
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.10)';
                  (e.currentTarget as HTMLAnchorElement).style.color = '#fff';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.background = '';
                  (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.68)';
                }
              }}
            >
              <Icon size={14} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* ── User footer ──────────────────────────────────── */}
      <div className="px-3 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
        <div className="flex items-center gap-2.5 px-2.5 py-2 mb-2 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.10)' }}>
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 text-white"
            style={{ background: 'rgba(255,255,255,0.25)' }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold truncate text-white">{name}</p>
            <p className="text-[9px] uppercase tracking-wider truncate mt-[1px]"
              style={{ color: 'rgba(255,255,255,0.55)' }}>
              {roleLabel}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] font-medium transition-all"
          style={{ color: 'rgba(255,255,255,0.60)' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.10)';
            (e.currentTarget as HTMLButtonElement).style.color = '#fff';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = '';
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.60)';
          }}
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
