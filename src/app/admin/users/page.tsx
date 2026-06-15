'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { api } from '@/lib/api';
import { Search, UserX, UserCheck, Key, UserPlus, LockOpen } from 'lucide-react';

interface User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: string;
  isActive: boolean;
  accountLocked?: boolean;
  createdAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  CHW: 'CHW',
  FACILITY_PROVIDER: 'Provider',
  CLINICAL_STAFF: 'Clinical',
  SUPERVISOR: 'Supervisor',
  SYSTEM_ADMIN: 'Admin',
  ADMIN: 'Admin',
  PATIENT: 'Patient',
};

function roleBadge(role: string) {
  const map: Record<string, 'info' | 'default' | 'warning' | 'high' | 'critical'> = {
    CHW: 'info',
    FACILITY_PROVIDER: 'default',
    CLINICAL_STAFF: 'default',
    SUPERVISOR: 'warning',
    SYSTEM_ADMIN: 'high',
    ADMIN: 'high',
    PATIENT: 'default',
  };
  return <Badge variant={map[role] ?? 'default'}>{ROLE_LABELS[role] ?? role}</Badge>;
}

const ROLES = ['ALL', 'CHW', 'FACILITY_PROVIDER', 'SUPERVISOR', 'SYSTEM_ADMIN', 'PATIENT'];

export default function UsersPage() {
  const [users, setUsers]         = useState<User[]>([]);
  const [search, setSearch]       = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [loading, setLoading]     = useState(true);
  const [acting, setActing]       = useState<string | null>(null);
  const [resetResult, setResetResult] = useState<{ name: string; pass: string } | null>(null);

  useEffect(() => {
    api.get('/api/admin/users')
      .then((r) => setUsers(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = users
    .filter((u) => roleFilter === 'ALL' || u.role === roleFilter)
    .filter((u) =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    );

  async function toggle(userId: string) {
    setActing(userId);
    try {
      await api.put(`/api/admin/users/${userId}/toggle-status`, {});
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, isActive: !u.isActive } : u));
    } finally {
      setActing(null);
    }
  }

  async function unlock(userId: string) {
    setActing(userId);
    try {
      await api.put(`/api/admin/users/${userId}/unlock`, {});
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, accountLocked: false } : u));
    } finally {
      setActing(null);
    }
  }

  async function resetPassword(userId: string, name: string) {
    setActing(userId);
    try {
      const r = await api.put(`/api/admin/users/${userId}/reset-password`, {});
      setResetResult({ name, pass: r.data.temporaryPassword });
    } finally {
      setActing(null);
    }
  }

  return (
    <DashboardLayout title="User Management">
      <div className="space-y-4">

        {/* ── Password reset modal ─────────────────────────────── */}
        {resetResult && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ background: 'rgba(12,24,37,0.45)' }}
            onClick={() => setResetResult(null)}
          >
            <div
              className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4"
              style={{ border: '1px solid #DCECF0', boxShadow: '0 20px 60px rgba(0,0,0,0.14)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-[11px] font-semibold uppercase tracking-widest text-text-hint mb-1">
                Password Reset
              </p>
              <h3 className="text-[16px] font-bold text-text-primary mb-4">
                Temporary password for {resetResult.name}
              </h3>
              <div
                className="rounded-lg p-4 text-center mb-3"
                style={{ background: '#EDF6F9', border: '1px solid #DCECF0' }}
              >
                <p className="data-num text-[22px] font-semibold tracking-widest" style={{ color: '#006D77' }}>
                  {resetResult.pass}
                </p>
              </div>
              <p className="text-[11px] text-text-hint mb-4">
                Share this securely. User must change on next login.
              </p>
              <Button className="w-full" onClick={() => setResetResult(null)}>Done</Button>
            </div>
          </div>
        )}

        {/* ── Page header ──────────────────────────────────────── */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-text-hint mb-1">
              System Administration
            </p>
            <h1 className="text-[20px] font-bold text-text-primary tracking-tight leading-none">
              User Management
            </h1>
          </div>
          <Button size="sm" icon={UserPlus} onClick={() => window.location.href = '/admin/users/create'}>
            Add User
          </Button>
        </div>

        <Card
          title={`Users (${filtered.length})`}
          action={
            <div className="flex items-center gap-2 flex-wrap">
              {/* Role filter pills */}
              <div className="flex gap-1 flex-wrap">
                {ROLES.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className="text-[11px] px-2.5 py-1 rounded font-semibold transition-colors"
                    style={{
                      background: roleFilter === r ? '#006D77' : '#EDF6F9',
                      color: roleFilter === r ? '#fff' : '#5A6474',
                      border: `1px solid ${roleFilter === r ? '#006D77' : '#DCECF0'}`,
                    }}
                  >
                    {r === 'ALL' ? 'All' : ROLE_LABELS[r] ?? r}
                  </button>
                ))}
              </div>
              {/* Search */}
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-hint pointer-events-none" />
                <input
                  className="pl-8 pr-3 py-1.5 text-[12px] rounded-lg bg-white outline-none w-40"
                  style={{ border: '1px solid #DCECF0' }}
                  placeholder="Search…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = '#006D77'; }}
                  onBlur={e  => { (e.currentTarget as HTMLInputElement).style.borderColor = '#DCECF0'; }}
                />
              </div>
            </div>
          }
        >
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #DCECF0' }}>
                    {['User', 'Email', 'Role', 'Status', 'Actions'].map(h => (
                      <th key={h} className="pb-3 pr-6 text-left text-[11px] font-semibold uppercase tracking-widest text-text-hint">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-[13px] text-text-hint">
                        No users found
                      </td>
                    </tr>
                  )}
                  {filtered.map((u) => (
                    <tr
                      key={u.id}
                      className="table-row-hover transition-colors"
                      style={{ borderBottom: '1px solid #E8F4F8' }}
                    >
                      <td className="py-3 pr-6">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold text-white"
                            style={{ background: u.isActive ? '#006D77' : '#AAB4BC' }}
                          >
                            {u.fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-[13px] font-semibold text-text-primary whitespace-nowrap">
                            {u.fullName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-6 text-[12px] text-text-secondary">{u.email}</td>
                      <td className="py-3 pr-6">{roleBadge(u.role)}</td>
                      <td className="py-3 pr-6">
                        <div className="flex items-center gap-1.5">
                          <Badge variant={u.isActive ? 'low' : 'default'}>
                            {u.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          {u.accountLocked && <Badge variant="critical">Locked</Badge>}
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          {u.accountLocked && (
                            <button
                              onClick={() => unlock(u.id)}
                              disabled={acting === u.id}
                              title="Unlock account"
                              className="p-1.5 rounded transition-colors"
                              style={{ color: '#27AE60' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F0FDF4'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                            >
                              <LockOpen size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => toggle(u.id)}
                            disabled={acting === u.id}
                            title={u.isActive ? 'Deactivate' : 'Activate'}
                            className="p-1.5 rounded transition-colors"
                            style={{ color: u.isActive ? '#C0392B' : '#27AE60' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = u.isActive ? '#FEF2F2' : '#F0FDF4'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                          >
                            {u.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                          </button>
                          <button
                            onClick={() => resetPassword(u.id, u.fullName)}
                            disabled={acting === u.id}
                            title="Reset password"
                            className="p-1.5 rounded transition-colors text-text-hint"
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#EDF6F9'; (e.currentTarget as HTMLButtonElement).style.color = '#006D77'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#AAB4BC'; }}
                          >
                            <Key size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
