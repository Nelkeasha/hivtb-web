'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import SortSelect from '@/components/ui/SortSelect';
import { api, extractErrorMessage } from '@/lib/api';
import { timeAgo } from '@/lib/utils';
import { useTableControls } from '@/lib/useTableControls';
import { CheckCircle2, Bell, AlertTriangle, Info, TrendingDown } from 'lucide-react';

const SEVERITY_RANK: Record<string, number> = { CRITICAL: 2, WARNING: 1, INFO: 0 };

interface Alert {
  id: string;
  patientName?: string;
  title: string;
  message: string;
  severity: string;
  alertType: string;
  createdAt: string;
  isResolved: boolean;
  resolvedByName?: string;
  escalatedAt?: string;
}

type Filter = 'ALL' | 'CRITICAL' | 'WARNING' | 'INFO';

const SEV_STYLE: Record<string, { accent: string; bg: string; border: string; iconColor: string }> = {
  CRITICAL: { accent: '#C0392B', bg: 'rgba(194,40,40,0.03)',  border: '#FECACA', iconColor: '#C0392B' },
  WARNING:  { accent: '#F39C12', bg: 'rgba(174,114,0,0.03)',  border: '#FDE68A', iconColor: '#F39C12' },
  INFO:     { accent: '#2980B9', bg: 'rgba(26,86,168,0.03)',  border: '#BFDBFE', iconColor: '#2980B9' },
};

function sevStyle(severity: string) {
  return SEV_STYLE[severity] ?? SEV_STYLE.INFO;
}

function alertIcon(severity: string, color: string, alertType?: string) {
  if (alertType === 'TREATMENT_FAILURE_RISK') return <TrendingDown size={15} style={{ color }} />;
  if (severity === 'CRITICAL') return <AlertTriangle size={15} style={{ color }} />;
  if (severity === 'WARNING')  return <Bell          size={15} style={{ color }} />;
  return                              <Info          size={15} style={{ color }} />;
}

function severityBadge(s: string) {
  if (s === 'CRITICAL') return <Badge variant="critical">{s}</Badge>;
  if (s === 'WARNING')  return <Badge variant="high">{s}</Badge>;
  return                       <Badge variant="info">{s}</Badge>;
}

// TREATMENT_FAILURE_RISK is a clinically distinct signal (possible treatment
// failure, not just a missed-dose/adherence issue) — give it its own
// critical-tinted chip instead of the generic gray "default" alertType badge,
// so it stands out from routine adherence alerts even when raised at the
// same severity.
function alertTypeBadge(alertType: string) {
  if (alertType === 'TREATMENT_FAILURE_RISK') {
    return <Badge variant="critical" size="sm">Treatment Failure Risk</Badge>;
  }
  return <Badge variant="default" size="sm">{alertType.replace(/_/g, ' ')}</Badge>;
}

const SUMMARY_CHIPS = [
  { key: 'CRITICAL', label: 'Critical', color: '#C0392B', bg: 'rgba(194,40,40,0.06)', border: '#FECACA' },
  { key: 'WARNING',  label: 'Warning',  color: '#F39C12', bg: 'rgba(174,114,0,0.06)', border: '#FDE68A' },
  { key: 'INFO',     label: 'Info',     color: '#2980B9', bg: 'rgba(26,86,168,0.06)', border: '#BFDBFE' },
];

export default function AlertsPage() {
  const [alerts, setAlerts]   = useState<Alert[]>([]);
  const [filter, setFilter]   = useState<Filter>('ALL');
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/alerts/clinical')
      .then((r) => setAlerts(r.data))
      .catch(e => setError(extractErrorMessage(e, 'Failed to load alerts. Try refreshing.')))
      .finally(() => setLoading(false));
  }, []);

  const active   = alerts.filter((a) => !a.isResolved);
  const filtered = active.filter((a) => filter === 'ALL' || a.severity === filter);
  const table = useTableControls(filtered, {
    pageSize: 8,
    getSortValue: (a, key) => (key === 'severity' ? SEVERITY_RANK[a.severity] ?? -1 : (a as unknown as Record<string, string>)[key]),
  });

  async function resolve(id: string) {
    const confirmed = window.confirm(
      'Resolve this alert?\n\nThis dismisses the notification only — it does not change the ' +
      'patient\'s risk score or adherence record. Only resolve after you\'ve actually taken the ' +
      'recommended action (e.g. home visit, phone call).'
    );
    if (!confirmed) return;

    setResolving(id);
    setError('');
    try {
      await api.put(`/api/alerts/${id}/resolve`, {});
      setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, isResolved: true } : a));
    } catch (err: unknown) {
            setError(extractErrorMessage(err, 'Failed to resolve alert. Try again.'));
    } finally {
      setResolving(null);
    }
  }

  return (
    <DashboardLayout title="Clinical Alerts">
      <div className="space-y-5">

        {/* ── Page header ─────────────────────────────────── */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-text-hint mb-1">
              Clinical Dashboard
            </p>
            <h1 className="text-[20px] font-bold text-text-primary tracking-tight leading-none">
              Clinical Alerts
            </h1>
          </div>
          {!loading && active.length > 0 && (
            <div className="text-right">
              <p
                className="data-num text-[30px] font-semibold leading-none"
                style={{
                  color: active.some((a) => a.severity === 'CRITICAL') ? '#C0392B' : '#F39C12',
                }}
              >
                {active.length}
              </p>
              <p className="text-[11px] text-text-hint mt-1 uppercase tracking-wide">Unresolved</p>
            </div>
          )}
        </div>

        {error && (
          <div
            className="flex items-start gap-2.5 rounded-lg p-3"
            style={{ background: 'rgba(194,40,40,0.04)', border: '1px solid #FECACA' }}
          >
            <p className="text-[12px] font-medium" style={{ color: '#C0392B' }}>{error}</p>
          </div>
        )}

        {/* ── Summary chips ────────────────────────────────── */}
        {!loading && (
          <div className="flex gap-2 flex-wrap">
            {SUMMARY_CHIPS.map(({ key, label, color, bg, border }) => {
              const count = active.filter((a) => a.severity === key).length;
              return (
                <div
                  key={key}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg"
                  style={{ background: bg, border: `1px solid ${border}` }}
                >
                  <span className="data-num text-[16px] font-semibold leading-none" style={{ color }}>
                    {count}
                  </span>
                  <span className="text-[12px] font-semibold" style={{ color }}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Main card ────────────────────────────────────── */}
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #DCECF0' }}>

          {/* Card header + filter pills */}
          <div
            className="flex items-center justify-between px-6 py-4 flex-wrap gap-3"
            style={{ borderBottom: '1px solid #E8F4F8' }}
          >
            <div>
              <h3 className="text-[13px] font-semibold text-text-primary tracking-tight">
                Active Alerts
              </h3>
              <p className="text-[11px] text-text-hint mt-0.5">
                {filtered.length} shown
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex gap-1">
                {(['ALL', 'CRITICAL', 'WARNING', 'INFO'] as Filter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className="text-[11px] px-2.5 py-1 rounded font-semibold transition-colors"
                    style={{
                      background: filter === f ? '#E8714A' : '#EDF6F9',
                      color:      filter === f ? '#fff'    : '#5A6474',
                      border:     `1px solid ${filter === f ? '#E8714A' : '#DCECF0'}`,
                    }}
                  >
                    {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
              <SortSelect
                options={[
                  { key: 'severity', label: 'Severity' },
                  { key: 'patientName', label: 'Patient' },
                  { key: 'createdAt', label: 'Date' },
                ]}
                sortKey={table.sortKey}
                sortDir={table.sortDir}
                onChange={table.toggleSort}
              />
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-text-hint">
                <CheckCircle2 size={36} className="mb-3" />
                <p className="text-[14px] font-semibold text-text-secondary">All clear</p>
                <p className="text-[12px] mt-1">No active alerts in this category</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {table.paged.map((alert) => {
                  const s = sevStyle(alert.severity);
                  return (
                    <div
                      key={alert.id}
                      className="flex items-start gap-4 rounded-lg p-4 transition-colors"
                      style={{
                        background:  s.bg,
                        border:      `1px solid ${s.border}`,
                        borderLeft:  `3px solid ${s.accent}`,
                      }}
                    >
                      {/* Icon */}
                      <div className="mt-0.5 shrink-0">
                        {alertIcon(alert.severity, s.iconColor, alert.alertType)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {alert.patientName && (
                          <p className="text-[13px] font-semibold text-text-primary">
                            {alert.patientName}
                          </p>
                        )}
                        <p className="text-[13px] text-text-secondary mt-0.5">
                          {alert.title}
                        </p>
                        {alert.message && (
                          <p className="text-[12px] text-text-hint mt-1 line-clamp-2">
                            {alert.message}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {severityBadge(alert.severity)}
                          {alertTypeBadge(alert.alertType)}
                          {alert.escalatedAt && (
                            <Badge variant="critical" size="sm">Escalated</Badge>
                          )}
                          <span
                            className="data-num text-[11px]"
                            style={{ color: '#AAB4BC' }}
                          >
                            {timeAgo(alert.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Resolve */}
                      <div className="shrink-0">
                        <Button
                          variant="secondary"
                          size="sm"
                          loading={resolving === alert.id}
                          onClick={() => resolve(alert.id)}
                          icon={CheckCircle2}
                        >
                          Resolve
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {!loading && (
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
