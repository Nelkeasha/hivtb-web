'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout, getUserName, getRole } from '@/lib/auth';
import {
  LayoutDashboard, Users, AlertCircle, FileText, ArrowLeftRight,
  BarChart3, UserCheck, LogOut, History, Settings, PersonStanding,
} from 'lucide-react';

/* Exact replica of Flutter's Icons.medical_services_rounded */
function MedicalServicesIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="white" aria-hidden>
      <path d="M20,6H16V4c0-1.1-0.9-2-2-2h-4C8.9,2,8,2.9,8,4v2H4C2.9,6,2,6.9,2,8v12c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V8C22,6.9,21.1,6,20,6z M14,4h-4v2h4V4z M13,17h-2v-2H9v-2h2v-2h2v2h2v2h-2V17z"/>
    </svg>
  );
}

interface NavItem { href: string; label: string; icon: React.ElementType; }

const clinicalNav: NavItem[] = [
  { href: '/clinical',           label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clinical/patients',  label: 'Patients',  icon: Users           },
  { href: '/clinical/alerts',    label: 'Alerts',    icon: AlertCircle     },
  { href: '/clinical/referrals', label: 'Referrals', icon: ArrowLeftRight  },
  { href: '/clinical/reports',   label: 'Reports',   icon: FileText        },
];

const supervisorNav: NavItem[] = [
  { href: '/supervisor',           label: 'Overview',   icon: LayoutDashboard },
  { href: '/supervisor/chw',       label: 'CHW Team',   icon: UserCheck       },
  { href: '/supervisor/ltfu',      label: 'Treatment Interruptions', icon: PersonStanding  },
  { href: '/supervisor/analytics', label: 'Analytics',  icon: BarChart3       },
  { href: '/supervisor/alerts',    label: 'Alerts',     icon: AlertCircle     },
  { href: '/supervisor/reports',   label: 'Reports',    icon: FileText        },
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

const W  = 'rgba(255,255,255,0.90)';   // white text — active / name
const WD = 'rgba(255,255,255,0.58)';   // white dim — inactive nav
const WG = 'rgba(255,255,255,0.38)';   // white ghost — labels, role
const WH = 'rgba(255,255,255,0.10)';   // white hover bg
const WA = 'rgba(255,255,255,0.16)';   // white active bg
const BR = 'rgba(255,255,255,0.12)';   // border / divider

export default function Sidebar() {
  const pathname = usePathname();
  const [name, setName]   = useState('');
  const [role, setRole]   = useState<string | undefined>(undefined);

  useEffect(() => {
    setName(getUserName());
    setRole(getRole() ?? undefined);
  }, []);

  const nav      = navByRole(role);
  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '';
  const section  = role ? (SECTION_LABELS[role] ?? 'Clinical') : 'Clinical';
  const roleLabel = role ? (ROLE_LABELS[role] ?? role.replace(/_/g, ' ')) : '';

  return (
    <aside
      className="fixed inset-y-0 left-0 w-60 flex flex-col z-40"
      style={{
        background: 'linear-gradient(175deg, #E8714A 0%, #C4552F 100%)',
      }}
    >
      {/* ── Logo ─────────────────────────────────────────── */}
      <div className="px-5 py-5" style={{ borderBottom: `1px solid ${BR}` }}>
        <div className="flex items-center gap-3">
          {/* TODO(logo): replace MedicalServicesIcon with the DMC heart-and-cross mark once
              the asset is supplied. Place dmc-logo.png/svg in public/ and swap in:
              <img src="/dmc-logo.png" alt="DMC" width={36} height={36} className="rounded-xl" /> */}
          <div
            className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              background: 'rgba(255,255,255,0.18)',
              border: '1.5px solid rgba(255,255,255,0.30)',
            }}
          >
            <MedicalServicesIcon size={18} />
          </div>
          <div>
            <p className="font-semibold text-[13px] leading-none text-white tracking-tight">
              HIV·TB Monitor
            </p>
            <p className="text-[10px] mt-[5px] tracking-wide" style={{ color: WG }}>
              Dream Medical · Rwanda
            </p>
          </div>
        </div>
      </div>

      {/* ── Navigation ────────────────────────────────────── */}
      <nav className="flex-1 px-3 pt-5 pb-3 space-y-[2px] overflow-y-auto">
        <p
          className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-2.5"
          style={{ color: WG }}
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
              className="flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] font-medium transition-all"
              style={active
                ? { background: WA, borderLeft: `2px solid ${W}`, color: '#fff' }
                : { borderLeft: '2px solid transparent', color: WD }
              }
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.background = WH;
                  (e.currentTarget as HTMLAnchorElement).style.color = W;
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.background = '';
                  (e.currentTarget as HTMLAnchorElement).style.color = WD;
                }
              }}
            >
              <Icon size={14} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* ── User footer ───────────────────────────────────── */}
      <div className="px-3 py-4" style={{ borderTop: `1px solid ${BR}` }}>
        <div className="flex items-center gap-2.5 px-2.5 py-2 mb-1">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0"
            style={{ background: WA, color: '#fff' }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold truncate" style={{ color: W }}>
              {name}
            </p>
            <p className="text-[10px] uppercase tracking-wide truncate mt-[2px]" style={{ color: WG }}>
              {roleLabel}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[12px] font-medium transition-all"
          style={{ color: WD }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = WH;
            (e.currentTarget as HTMLButtonElement).style.color = W;
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = '';
            (e.currentTarget as HTMLButtonElement).style.color = WD;
          }}
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
