'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import SortableTh from '@/components/ui/SortableTh';
import { api, extractErrorMessage } from '@/lib/api';
import { timeAgo } from '@/lib/utils';
import { useTableControls } from '@/lib/useTableControls';
import { Search, ShieldCheck, ShieldAlert, Link2 } from 'lucide-react';
import ApiErrorBanner from '@/components/ui/ApiErrorBanner';

interface AuditLog {
  id: string;
  userEmail: string;
  action: string;
  targetTable?: string;
  details?: string;
  timestamp: string;
}

interface ChainVerification {
  intact: boolean;
  entriesChecked: number;
  brokenAtEntryId?: string;
  reason?: string;
}

const ACTIONS = [
  'ALL', 'LOGIN', 'CREATE_USER', 'DEACTIVATE_USER', 'ACTIVATE_USER',
  'RESET_PASSWORD', 'REGISTER_PATIENT', 'RECORD_VISIT', 'CHANGE_PASSWORD',
];

const ACTION_LABELS: Record<string, string> = {
  ALL:              'All',
  LOGIN:            'Login',
  CREATE_USER:      'Create',
  DEACTIVATE_USER:  'Deactivate',
  ACTIVATE_USER:    'Activate',
  RESET_PASSWORD:   'Reset PW',
  REGISTER_PATIENT: 'Register',
  RECORD_VISIT:     'Visit',
  CHANGE_PASSWORD:  'Change PW',
};

function actionBadge(action: string) {
  if (action.includes('DEACTIVATE') || action.includes('DELETE'))
    return <Badge variant="high">{action.replace(/_/g, ' ')}</Badge>;
  if (action.includes('CREATE') || action.includes('REGISTER'))
    return <Badge variant="low">{action.replace(/_/g, ' ')}</Badge>;
  if (action === 'LOGIN')
    return <Badge variant="info">LOGIN</Badge>;
  return <Badge variant="default">{action.replace(/_/g, ' ')}</Badge>;
}

export default function AuditLogPage() {
  const [logs, setLogs]     = useState<AuditLog[]>([]);
  const [action, setAction] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [verification, setVerification] = useState<ChainVerification | null>(null);
  const [verifying, setVerifying] = useState(false);

  async function verifyChain() {
    setVerifying(true);
    try {
      const r = await api.get('/api/admin/audit-log/verify-chain');
      setVerification(r.data);
    } catch {
      setVerification({ intact: false, entriesChecked: 0, reason: 'Could not reach the server.' });
    } finally {
      setVerifying(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    const params = action !== 'ALL' ? `?action=${action}` : '';
    api.get(`/api/admin/audit-log${params}`)
      .then((r) => setLogs(r.data))
      .catch(e => setApiError(extractErrorMessage(e, 'Failed to load audit log. Try refreshing.')))
      .finally(() => setLoading(false));
  }, [action]);

  const filtered = logs.filter((l) =>
    l.userEmail.toLowerCase().includes(search.toLowerCase()) ||
    l.action.toLowerCase().includes(search.toLowerCase())
  );
  const table = useTableControls(filtered, { pageSize: 15 });

  return (
    <DashboardLayout title="Audit Log">
      <div className="space-y-5">
        {apiError && <ApiErrorBanner message={apiError} onDismiss={() => setApiError('')} />}

        {/* ── Page header ─────────────────────────────────── */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-text-hint mb-1">
              System Administration
            </p>
            <h1 className="text-[20px] font-bold text-text-primary tracking-tight leading-none">
              Audit Log
            </h1>
          </div>
          {!loading && (
            <div className="text-right">
              <p className="data-num text-[30px] font-semibold leading-none" style={{ color: '#E74A2E' }}>
                {filtered.length}
              </p>
              <p className="text-[11px] text-text-hint mt-1 uppercase tracking-wide">
                Entries
              </p>
            </div>
          )}
        </div>

        {/* ── Tamper-evidence chain verification ────────────── */}
        <div
          className="bg-white rounded-xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap"
          style={{ border: '1px solid #E9E9E9' }}
        >
          <div className="flex items-center gap-3">
            <Link2 size={16} className="text-text-hint shrink-0" />
            <div>
              <p className="text-[12.5px] font-semibold text-text-primary">
                Tamper-evidence chain
              </p>
              <p className="text-[11px] text-text-hint mt-0.5">
                Each entry is hash-chained to the one before it — verifying recomputes every hash to confirm nothing was altered.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {verification && (
              verification.intact ? (
                <span className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: '#27AE60' }}>
                  <ShieldCheck size={14} />
                  Intact — {verification.entriesChecked} entries checked
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: '#C0392B' }}>
                  <ShieldAlert size={14} />
                  {verification.reason ?? 'Chain broken'}
                  {verification.brokenAtEntryId && ` (at entry ${verification.brokenAtEntryId.slice(0, 8)}…)`}
                </span>
              )
            )}
            <button
              onClick={verifyChain}
              disabled={verifying}
              className="text-[11px] px-3 py-1.5 rounded-lg font-semibold transition-colors disabled:opacity-50"
              style={{ background: '#E74A2E', color: '#fff' }}
            >
              {verifying ? 'Verifying…' : 'Verify chain'}
            </button>
          </div>
        </div>

        {/* ── Main card ────────────────────────────────────── */}
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E9E9E9' }}>

          {/* Header: filters + search */}
          <div
            className="flex items-center justify-between gap-3 px-6 py-4 flex-wrap"
            style={{ borderBottom: '1px solid #F0F0F0' }}
          >
            <div>
              <h3 className="text-[13px] font-semibold text-text-primary tracking-tight">
                System Events
              </h3>
              <p className="text-[11px] text-text-hint mt-0.5">
                All user actions and data changes
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Action filter pills */}
              <div className="flex gap-1 flex-wrap">
                {ACTIONS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAction(a)}
                    className="text-[11px] px-2.5 py-1 rounded font-semibold transition-colors"
                    style={{
                      background: action === a ? '#E74A2E' : '#FAFAFA',
                      color:      action === a ? '#fff'    : '#6B7280',
                      border:     `1px solid ${action === a ? '#E74A2E' : '#E9E9E9'}`,
                    }}
                  >
                    {ACTION_LABELS[a] ?? a}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative">
                <Search
                  size={12}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-hint"
                />
                <input
                  className="pl-8 pr-3 py-1.5 text-[12px] rounded-lg bg-white outline-none w-36"
                  style={{ border: '1px solid #E9E9E9' }}
                  placeholder="Filter…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={e  => { (e.currentTarget as HTMLInputElement).style.borderColor = '#E74A2E'; }}
                  onBlur={e   => { (e.currentTarget as HTMLInputElement).style.borderColor = '#E9E9E9'; }}
                />
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center py-14 text-text-hint">
                <ShieldCheck size={32} className="mb-3" />
                <p className="text-[13px] font-medium text-text-secondary">No audit entries</p>
                <p className="text-[12px] mt-1">Try changing the filter or search term</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E9E9E9' }}>
                      <SortableTh label="Action" sortKey="action" activeSortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                      <SortableTh label="User" sortKey="userEmail" activeSortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                      <SortableTh label="Target" sortKey="targetTable" activeSortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                      <th className="pb-3 pr-6 text-left text-[11px] font-semibold uppercase tracking-widest text-text-hint">Details</th>
                      <SortableTh label="When" sortKey="timestamp" activeSortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                    </tr>
                  </thead>
                  <tbody>
                    {table.paged.map((log) => (
                      <tr
                        key={log.id}
                        className="table-row-hover transition-colors"
                        style={{ borderBottom: '1px solid #F0F0F0' }}
                      >
                        <td className="py-3 pr-6">
                          {actionBadge(log.action)}
                        </td>
                        <td className="py-3 pr-6 text-[12px] text-text-secondary">
                          {log.userEmail}
                        </td>
                        <td className="py-3 pr-6 data-num text-[12px] text-text-hint">
                          {log.targetTable ?? '—'}
                        </td>
                        <td className="py-3 pr-6 text-[12px] text-text-secondary max-w-[200px] truncate">
                          {log.details ?? '—'}
                        </td>
                        <td className="py-3 data-num text-[11px] whitespace-nowrap" style={{ color: '#9CA3AF' }}>
                          {timeAgo(log.timestamp)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {!loading && filtered.length > 0 && (
            <Pagination
              page={table.page}
              totalPages={table.totalPages}
              totalItems={table.totalItems}
              pageSize={table.pageSize}
              onPageChange={table.setPage}
            />
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
