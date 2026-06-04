'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { api } from '@/lib/api';
import { timeAgo } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, Bell } from 'lucide-react';

interface Alert {
  id: string;
  patientName?: string;
  title: string;
  message: string;
  severity: string;
  alertType: string;
  createdAt: string;
  isResolved: boolean;
}

type Filter = 'ALL' | 'CRITICAL' | 'HIGH';

const SEV_STYLE: Record<string, { accent: string; bg: string; border: string }> = {
  CRITICAL: { accent: '#C0392B', bg: 'rgba(194,40,40,0.03)', border: '#FECACA' },
  HIGH:     { accent: '#F39C12', bg: 'rgba(174,114,0,0.03)',  border: '#FDE68A' },
};

function sevStyle(severity: string) {
  return SEV_STYLE[severity] ?? SEV_STYLE.HIGH;
}

export default function SupervisorAlertsPage() {
  const [alerts, setAlerts]   = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);
  const [filter, setFilter]   = useState<Filter>('ALL');

  useEffect(() => {
    api.get('/api/supervisor/dashboard/alerts')
      .then((r) => setAlerts((r.data as Alert[]).filter((a) => !a.isResolved)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function resolve(id: string) {
    setResolving(id);
    try {
      await api.put(`/api/alerts/${id}/resolve`, {});
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } finally {
      setResolving(null);
    }
  }

  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL').length;
  const highCount     = alerts.filter((a) => a.severity !== 'CRITICAL').length;

  const visible = filter === 'ALL'      ? alerts
    : filter === 'CRITICAL' ? alerts.filter((a) => a.severity === 'CRITICAL')
    : alerts.filter((a) => a.severity !== 'CRITICAL');

  return (
    <DashboardLayout title="Facility Alerts">
      <div className="space-y-5">

        {/* ── Page header ─────────────────────────────────── */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-text-hint mb-1">
              Supervisor Dashboard
            </p>
            <h1 className="text-[20px] font-bold text-text-primary tracking-tight leading-none">
              Facility Alerts
            </h1>
          </div>
          {!loading && alerts.length > 0 && (
            <div className="text-right">
              <p
                className="data-num text-[30px] font-semibold leading-none"
                style={{ color: criticalCount > 0 ? '#C0392B' : '#F39C12' }}
              >
                {alerts.length}
              </p>
              <p className="text-[11px] text-text-hint mt-1 uppercase tracking-wide">
                Unresolved
              </p>
            </div>
          )}
        </div>

        {/* ── Main card ────────────────────────────────────── */}
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #DCECF0' }}>

          {/* Card header with filter pills */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: '1px solid #E8F4F8' }}
          >
            <div>
              <h3 className="text-[13px] font-semibold text-text-primary tracking-tight">
                Active Alerts
              </h3>
              <p className="text-[11px] text-text-hint mt-0.5">
                {alerts.length} unresolved
              </p>
            </div>

            {alerts.length > 0 && (
              <div className="flex gap-1">
                {(['ALL', 'CRITICAL', 'HIGH'] as Filter[]).map((f) => {
                  const count = f === 'ALL' ? alerts.length : f === 'CRITICAL' ? criticalCount : highCount;
                  return (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className="text-[11px] px-2.5 py-1 rounded font-semibold transition-colors"
                      style={{
                        background: filter === f ? '#006D77' : '#EDF6F9',
                        color: filter === f ? '#fff' : '#5A6474',
                        border: `1px solid ${filter === f ? '#006D77' : '#DCECF0'}`,
                      }}
                    >
                      {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()} {count > 0 && `(${count})`}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : alerts.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-text-hint">
                <CheckCircle2 size={36} className="mb-3" />
                <p className="text-[14px] font-semibold text-text-secondary">All clear</p>
                <p className="text-[12px] mt-1">No active alerts for this facility</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {visible.map((alert) => {
                  const s = sevStyle(alert.severity);
                  return (
                    <div
                      key={alert.id}
                      className="flex items-start gap-4 rounded-lg p-4 transition-colors"
                      style={{
                        background: s.bg,
                        border: `1px solid ${s.border}`,
                        borderLeft: `3px solid ${s.accent}`,
                      }}
                    >
                      {/* Severity icon */}
                      <div className="mt-0.5 shrink-0">
                        {alert.severity === 'CRITICAL'
                          ? <AlertTriangle size={15} style={{ color: '#C0392B' }} />
                          : <Bell         size={15} style={{ color: '#F39C12' }} />
                        }
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
                          <Badge variant={alert.severity === 'CRITICAL' ? 'critical' : 'high'}>
                            {alert.severity}
                          </Badge>
                          <Badge variant="default">
                            {alert.alertType.replace(/_/g, ' ')}
                          </Badge>
                          <span
                            className="data-num text-[11px]"
                            style={{ color: '#AAB4BC' }}
                          >
                            {timeAgo(alert.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Resolve button */}
                      <div className="shrink-0">
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={CheckCircle2}
                          loading={resolving === alert.id}
                          onClick={() => resolve(alert.id)}
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
        </div>
      </div>
    </DashboardLayout>
  );
}
