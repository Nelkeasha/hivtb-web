'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout, getUserName, getRole } from '@/lib/auth';
import {
  LayoutDashboard, Users, AlertCircle, FileText, ArrowLeftRight,
  BarChart3, UserCheck, LogOut, History, Settings, PersonStanding, Home,
} from 'lucide-react';

interface NavItem { href: string; label: string; icon: React.ElementType; }

const clinicalNav: NavItem[] = [
  { href: '/clinical',           label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clinical/patients',  label: 'Patients',  icon: Users           },
  { href: '/clinical/alerts',    label: 'Alerts',    icon: AlertCircle     },
  { href: '/clinical/referrals', label: 'Referrals', icon: ArrowLeftRight  },
  { href: '/clinical/home-visits', label: 'Home Visits', icon: Home        },
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
      className="fixed inset-y-0 left-0 w-[220px] flex flex-col z-40 bg-white"
      style={{ borderRight: '1px solid #ECECEC', boxShadow: '1px 0 0 #ECECEC' }}
    >
      {/* ── Brand header ─────────────────────────────────── */}
      <div
        className="px-4 py-4 flex flex-col"
        style={{ borderBottom: '1px solid #ECECEC' }}
      >
        <Image
          src="/dmc-logo.png"
          alt="Dream Medical Center"
          width={148}
          height={61}
          priority
          style={{ objectFit: 'contain', width: '148px', height: 'auto' }}
        />
        <p
          className="text-[9px] font-semibold uppercase tracking-[0.14em] mt-2 px-0.5"
          style={{ color: '#9C3219', fontFamily: "'IBM Plex Mono', monospace" }}
        >
          HIV/TB Monitoring System
        </p>
      </div>

      {/* ── Navigation ───────────────────────────────────── */}
      <nav className="flex-1 px-3 pt-5 pb-3 space-y-px overflow-y-auto">
        <p
          className="text-[9px] font-bold uppercase tracking-[0.14em] px-3 mb-3"
          style={{ color: '#9CA3AF', fontFamily: "'IBM Plex Mono', monospace" }}
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
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all relative"
              style={active
                ? {
                    background: 'rgba(230,75,46,0.09)',
                    color: '#C73E22',
                    fontWeight: 600,
                    borderLeft: '3px solid #E64B2E',
                    paddingLeft: '9px',    /* compensate for 3px border */
                  }
                : {
                    color: '#6B7280',
                    borderLeft: '3px solid transparent',
                    paddingLeft: '9px',
                  }
              }
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.background = '#F9F9F9';
                  (e.currentTarget as HTMLAnchorElement).style.color = '#2C2C2C';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.background = '';
                  (e.currentTarget as HTMLAnchorElement).style.color = '#6B7280';
                }
              }}
            >
              <Icon
                size={15}
                style={{ color: active ? '#E64B2E' : '#9CA3AF', flexShrink: 0 }}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* ── User footer ──────────────────────────────────── */}
      <div className="px-3 py-3" style={{ borderTop: '1px solid #ECECEC' }}>
        <div
          className="flex items-center gap-2.5 px-2.5 py-2 mb-1.5 rounded-lg"
          style={{ background: '#F9F9F9' }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 text-white"
            style={{ background: 'linear-gradient(135deg, #E64B2E, #9C3219)' }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold truncate" style={{ color: '#2C2C2C' }}>{name}</p>
            <p
              className="text-[9px] uppercase tracking-wider truncate mt-px"
              style={{ color: '#9CA3AF', fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {roleLabel}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all"
          style={{ color: '#9CA3AF' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = '#FEF2F2';
            (e.currentTarget as HTMLButtonElement).style.color = '#C0392B';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = '';
            (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF';
          }}
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
