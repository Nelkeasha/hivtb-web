'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import SortSelect from '@/components/ui/SortSelect';
import { api } from '@/lib/api';
import { formatDate, timeAgo } from '@/lib/utils';
import { useTableControls } from '@/lib/useTableControls';
import { AlertTriangle, Clock, UserX, TrendingDown } from 'lucide-react';

interface TracingTask {
  id: string;
  patientName: string;
  patientCode: string;
  village?: string;
  chwName: string;
  missedAppointmentDate: string;
  daysSinceMissed: number;
  reason: string;
  status: string;
  outcome?: string;
  disengagementReason?: string;
  ltfuConfirmedAt?: string;
  escalatedToName?: string;
  createdAt: string;
}

type TabKey = 'ESCALATED' | 'TREATMENT_INTERRUPTED' | 'IIT_ESCALATED' | 'ALL';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'ESCALATED',             label: 'Escalated'  },
  { key: 'TREATMENT_INTERRUPTED', label: 'Interrupted'},
  { key: 'IIT_ESCALATED',         label: 'Tracing'    },
  { key: 'ALL',                   label: 'All'        },
];

const STATUS_STYLE: Record<string, { accent: string; bg: string; border: string }> = {
  TREATMENT_INTERRUPTED: { accent: '#C0392B', bg: 'rgba(194,40,40,0.03)',  border: '#FECACA' },
  ESCALATED:              { accent: '#E67E22', bg: 'rgba(184,68,0,0.03)',   border: '#FED7AA' },
  IIT_ESCALATED:          { accent: '#F39C12', bg: 'rgba(174,114,0,0.03)',  border: '#FDE68A' },
};

function caseStyle(status: string) {
  return STATUS_STYLE[status] ?? { accent: '#006D77', bg: 'rgba(0,95,107,0.02)', border: '#DCECF0' };
}

function statusBadge(s: string) {
  if (s === 'TREATMENT_INTERRUPTED') return <Badge variant="critical">Treatment Interrupted</Badge>;
  if (s === 'ESCALATED')             return <Badge variant="high">Escalated</Badge>;
  if (s === 'IIT_ESCALATED')         return <Badge variant="moderate">Tracing</Badge>;
  if (s === 'RESOLVED')              return <Badge variant="low">Resolved</Badge>;
  return <Badge variant="info">Late</Badge>;
}

export default function LtfuPage() {
  const [tasks, setTasks]     = useState<TracingTask[]>([]);
  const [tab, setTab]         = useState<TabKey>('ESCALATED');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/tracing/supervisor/escalated')
      .then((r) => {
        const escalated: TracingTask[] = r.data;
        return api.get('/api/tracing/supervisor/ltfu-confirmed').then((r2) => {
          const confirmed: TracingTask[] = r2.data;
          const unique = Array.from(
            new Map([...escalated, ...confirmed].map((t) => [t.id, t])).values()
          );
          setTasks(unique);
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const counts = {
    ESCALATED:             tasks.filter((t) => t.status === 'ESCALATED').length,
    TREATMENT_INTERRUPTED: tasks.filter((t) => t.status === 'TREATMENT_INTERRUPTED').length,
    IIT_ESCALATED:         tasks.filter((t) => t.status === 'IIT_ESCALATED').length,
  };

  const filtered = tab === 'ALL' ? tasks : tasks.filter((t) => t.status === tab);
  const table = useTableControls(filtered, { pageSize: 8 });

  return (
    <DashboardLayout title="Treatment Interruption Cases">
      <div className="space-y-6">

        {/* ── Page header ─────────────────────────────────── */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-text-hint mb-1">
              Supervisor Dashboard
            </p>
            <h1 className="text-[20px] font-bold text-text-primary tracking-tight leading-none">
              Treatment Interruption Cases
            </h1>
          </div>
          {!loading && tasks.length > 0 && (
            <div className="text-right">
              <p
                className="data-num text-[30px] font-semibold leading-none"
                style={{ color: counts.TREATMENT_INTERRUPTED > 0 ? '#C0392B' : '#F39C12' }}
              >
                {tasks.length}
              </p>
              <p className="text-[11px] text-text-hint mt-1 uppercase tracking-wide">
                Active cases
              </p>
            </div>
          )}
        </div>

        {/* ── Stats strip ──────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total Cases',    value: tasks.length,          color: '#1A1A2E', icon: UserX         },
            { label: 'Escalated',      value: counts.ESCALATED,      color: '#E67E22', icon: AlertTriangle },
            { label: 'Treatment Interrupted', value: counts.TREATMENT_INTERRUPTED, color: '#C0392B', icon: AlertTriangle },
            { label: 'In Tracing',     value: counts.IIT_ESCALATED,         color: '#F39C12', icon: TrendingDown  },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-xl p-4 text-center"
              style={{ border: '1px solid #DCECF0' }}
            >
              <s.icon size={15} className="mx-auto mb-2" style={{ color: s.color }} />
              <p className="data-num text-[22px] font-semibold leading-none" style={{ color: s.color }}>
                {s.value}
              </p>
              <p className="text-[10px] text-text-hint mt-1 uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Cases card ───────────────────────────────────── */}
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #DCECF0' }}>

          {/* Header + tab filter */}
          <div
            className="flex items-center justify-between px-6 py-4 flex-wrap gap-3"
            style={{ borderBottom: '1px solid #E8F4F8' }}
          >
            <div>
              <h3 className="text-[13px] font-semibold text-text-primary tracking-tight">
                Cases
              </h3>
              <p className="text-[11px] text-text-hint mt-0.5">
                {filtered.length} shown
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex gap-1">
                {TABS.map(({ key, label }) => {
                  const count = key === 'ALL' ? tasks.length : counts[key as keyof typeof counts] ?? 0;
                  return (
                    <button
                      key={key}
                      onClick={() => setTab(key)}
                      className="text-[11px] px-2.5 py-1 rounded font-semibold transition-colors"
                      style={{
                        background: tab === key ? '#006D77' : '#EDF6F9',
                        color:      tab === key ? '#fff'    : '#5A6474',
                        border:     `1px solid ${tab === key ? '#006D77' : '#DCECF0'}`,
                      }}
                    >
                      {label}{count > 0 && ` (${count})`}
                    </button>
                  );
                })}
              </div>
              <SortSelect
                options={[
                  { key: 'patientName', label: 'Patient' },
                  { key: 'daysSinceMissed', label: 'Days Missed' },
                  { key: 'chwName', label: 'CHW' },
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
              <div className="py-12 text-center text-[13px] text-text-hint">
                No cases in this category
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {table.paged.map((task) => {
                  const s = caseStyle(task.status);
                  return (
                    <div
                      key={task.id}
                      className="rounded-lg p-4"
                      style={{
                        background:  s.bg,
                        border:      `1px solid ${s.border}`,
                        borderLeft:  `3px solid ${s.accent}`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">

                        {/* Main content */}
                        <div className="flex-1 min-w-0">

                          {/* Name row */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-[13px] font-semibold text-text-primary">
                              {task.patientName}
                            </p>
                            <span className="data-num text-[11px] text-text-hint">
                              {task.patientCode}
                            </span>
                            {task.village && (
                              <span className="text-[11px] text-text-hint">· {task.village}</span>
                            )}
                            {statusBadge(task.status)}
                          </div>

                          {/* Days counter */}
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <AlertTriangle size={12} className="shrink-0" style={{ color: s.accent }} />
                            <p className="text-[13px] font-semibold" style={{ color: s.accent }}>
                              <span className="data-num">{task.daysSinceMissed}</span> days without contact
                            </p>
                          </div>

                          {/* Metadata row */}
                          <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                            <MetaItem label="CHW" value={task.chwName} />
                            <MetaItem label="Missed" value={formatDate(task.missedAppointmentDate)} mono />
                            <MetaItem label="Reason" value={task.reason.replace(/_/g, ' ')} />
                            {task.escalatedToName && (
                              <MetaItem label="Escalated to" value={task.escalatedToName} />
                            )}
                          </div>

                          {/* Outcome */}
                          {task.outcome && (
                            <p className="text-[12px] mt-1.5 text-text-secondary">
                              Outcome:{' '}
                              <span className="font-medium">{task.outcome.replace(/_/g, ' ')}</span>
                              {task.disengagementReason && (
                                <span className="text-text-hint"> · {task.disengagementReason.replace(/_/g, ' ')}</span>
                              )}
                            </p>
                          )}
                        </div>

                        {/* Timestamps */}
                        <div className="text-right shrink-0 space-y-1">
                          <div
                            className="flex items-center justify-end gap-1 data-num text-[11px]"
                            style={{ color: '#AAB4BC' }}
                          >
                            <Clock size={10} />
                            {timeAgo(task.createdAt)}
                          </div>
                          {task.ltfuConfirmedAt && (
                            <p className="data-num text-[10px]" style={{ color: '#C0392B' }}>
                              Confirmed {timeAgo(task.ltfuConfirmedAt)}
                            </p>
                          )}
                        </div>
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

function MetaItem({ label, value, mono = false }: {
  label: string; value: string; mono?: boolean;
}) {
  return (
    <span className="text-[12px] text-text-hint">
      {label}:{' '}
      <span className={`text-text-secondary font-medium ${mono ? 'data-num' : ''}`}>
        {value}
      </span>
    </span>
  );
}
