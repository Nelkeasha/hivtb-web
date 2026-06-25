'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import SortSelect from '@/components/ui/SortSelect';
import { api, extractErrorMessage } from '@/lib/api';
import { formatDate, timeAgo } from '@/lib/utils';
import { useTableControls } from '@/lib/useTableControls';
import { CheckCircle2, XCircle, Edit3, Send } from 'lucide-react';

interface Referral {
  id: string;
  patientName?: string;
  patientCode?: string;
  referralReason: string;
  urgency: string;
  status: string;
  referralDate: string;
  facilityAppointmentDate?: string;
  providerNotes?: string;
  attendanceNotes?: string;
  isConfirmed?: boolean;
}

type Tab = 'ALL' | 'PENDING' | 'CONFIRMED' | 'ATTENDED' | 'NOT_ATTENDED';

const STATUS_TABS: { key: Tab; label: string }[] = [
  { key: 'ALL',          label: 'All'          },
  { key: 'PENDING',      label: 'Pending'      },
  { key: 'CONFIRMED',    label: 'Confirmed'    },
  { key: 'ATTENDED',     label: 'Attended'     },
  { key: 'NOT_ATTENDED', label: 'Not Attended' },
];

const URGENCY_STYLE: Record<string, { accent: string; bg: string; border: string }> = {
  EMERGENCY: { accent: '#C0392B', bg: 'rgba(194,40,40,0.03)',  border: '#FECACA' },
  URGENT:    { accent: '#E67E22', bg: 'rgba(184,68,0,0.03)',   border: '#FED7AA' },
  ROUTINE:   { accent: '#D12C1F', bg: 'rgba(209,44,31,0.02)',   border: '#DCECF0' },
};

function urgencyStyle(u: string) {
  return URGENCY_STYLE[u] ?? URGENCY_STYLE.ROUTINE;
}

function urgencyBadge(u: string) {
  if (u === 'EMERGENCY') return <Badge variant="critical">Emergency</Badge>;
  if (u === 'URGENT')    return <Badge variant="high">Urgent</Badge>;
  return                        <Badge variant="default">Routine</Badge>;
}

function statusBadge(s: string) {
  if (s === 'ATTENDED')                         return <Badge variant="low">Attended</Badge>;
  if (s === 'NOT_ATTENDED')                     return <Badge variant="high">Not Attended</Badge>;
  if (s === 'CONFIRMED' || s === 'MODIFIED')    return <Badge variant="info">Confirmed</Badge>;
  if (s === 'CANCELLED')                        return <Badge variant="critical">Cancelled</Badge>;
  return                                               <Badge variant="moderate">Pending</Badge>;
}

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [tab, setTab]             = useState<Tab>('ALL');
  const [loading, setLoading]     = useState(true);
  const [acting, setActing]       = useState<string | null>(null);
  const [error, setError]         = useState('');

  useEffect(() => {
    api.get('/api/clinical/referrals')
      .then((r) => setReferrals(r.data))
      .catch(e => setError(extractErrorMessage(e, 'Failed to load referrals. Try refreshing.')))
      .finally(() => setLoading(false));
  }, []);

  const filtered = referrals.filter((r) => tab === 'ALL' || r.status === tab);
  const table = useTableControls(filtered, { pageSize: 8 });

  const counts: Partial<Record<Tab, number>> = {
    ALL:          referrals.length,
    PENDING:      referrals.filter((r) => r.status === 'PENDING').length,
    CONFIRMED:    referrals.filter((r) => r.status === 'CONFIRMED' || r.status === 'MODIFIED').length,
    ATTENDED:     referrals.filter((r) => r.status === 'ATTENDED').length,
    NOT_ATTENDED: referrals.filter((r) => r.status === 'NOT_ATTENDED').length,
  };

  async function confirm(id: string) {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    setActing(id);
    setError('');
    try {
      await api.put(`/api/clinical/referrals/${id}/confirm`, {
        facilityAppointmentDate: date.toISOString().split('T')[0],
      });
      setReferrals((prev) =>
        prev.map((r) => r.id === id ? { ...r, status: 'CONFIRMED' } : r)
      );
    } catch (err: unknown) {
            setError(extractErrorMessage(err, 'Failed to confirm referral. Try again.'));
    } finally {
      setActing(null);
    }
  }

  async function recordAttendance(id: string, attended: boolean) {
    setActing(id);
    setError('');
    try {
      await api.put(`/api/clinical/referrals/${id}/attendance`, {
        status: attended ? 'ATTENDED' : 'NOT_ATTENDED',
        attendanceNotes: attended ? 'Patient attended as scheduled' : 'Patient did not attend',
      });
      setReferrals((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: attended ? 'ATTENDED' : 'NOT_ATTENDED' } : r
        )
      );
    } catch (err: unknown) {
            setError(extractErrorMessage(err, 'Failed to record attendance. Try again.'));
    } finally {
      setActing(null);
    }
  }

  return (
    <DashboardLayout title="Referral Management">
      <div className="space-y-5">

        {/* ── Page header ─────────────────────────────────── */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-text-hint mb-1">
              Clinical Dashboard
            </p>
            <h1 className="text-[20px] font-bold text-text-primary tracking-tight leading-none">
              Referral Management
            </h1>
          </div>
          {!loading && referrals.length > 0 && (
            <div className="text-right">
              <p className="data-num text-[30px] font-semibold leading-none" style={{ color: '#D12C1F' }}>
                {referrals.length}
              </p>
              <p className="text-[11px] text-text-hint mt-1 uppercase tracking-wide">Total referrals</p>
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

        {/* ── Main card ────────────────────────────────────── */}
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #DCECF0' }}>

          {/* Header + tab filter */}
          <div
            className="flex items-center justify-between gap-3 px-6 py-4 flex-wrap"
            style={{ borderBottom: '1px solid #E8F4F8' }}
          >
            <div>
              <h3 className="text-[13px] font-semibold text-text-primary tracking-tight">
                Patient Referrals
              </h3>
              <p className="text-[11px] text-text-hint mt-0.5">
                {filtered.length} shown
              </p>
            </div>
            <div className="flex gap-1 flex-wrap">
              {STATUS_TABS.map(({ key, label }) => {
                const count = counts[key] ?? 0;
                return (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className="text-[11px] px-2.5 py-1 rounded font-semibold transition-colors"
                    style={{
                      background: tab === key ? '#D12C1F' : '#EDF6F9',
                      color:      tab === key ? '#fff'    : '#5A6474',
                      border:     `1px solid ${tab === key ? '#D12C1F' : '#DCECF0'}`,
                    }}
                  >
                    {label}{count > 0 && key !== 'ALL' && ` (${count})`}
                  </button>
                );
              })}
            </div>
            <SortSelect
              options={[
                { key: 'patientName', label: 'Patient' },
                { key: 'urgency', label: 'Urgency' },
                { key: 'status', label: 'Status' },
                { key: 'referralDate', label: 'Referral Date' },
              ]}
              sortKey={table.sortKey}
              sortDir={table.sortDir}
              onChange={table.toggleSort}
            />
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center py-14 text-text-hint">
                <Send size={32} className="mb-3" />
                <p className="text-[13px] font-medium text-text-secondary">No referrals found</p>
                <p className="text-[12px] mt-1">Try switching to a different status filter</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {table.paged.map((ref) => {
                  const s = urgencyStyle(ref.urgency);
                  return (
                    <div
                      key={ref.id}
                      className="flex items-start gap-4 rounded-lg p-4"
                      style={{
                        background:  s.bg,
                        border:      `1px solid ${s.border}`,
                        borderLeft:  `3px solid ${s.accent}`,
                      }}
                    >
                      {/* Content */}
                      <div className="flex-1 min-w-0">

                        {/* Name + badges row */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[13px] font-semibold text-text-primary">
                            {ref.patientName ?? 'Unknown Patient'}
                          </p>
                          {ref.patientCode && (
                            <span className="data-num text-[11px] text-text-hint">
                              {ref.patientCode}
                            </span>
                          )}
                          {urgencyBadge(ref.urgency)}
                          {statusBadge(ref.status)}
                        </div>

                        {/* Reason */}
                        <p className="text-[12px] text-text-secondary mt-1.5 line-clamp-2">
                          {ref.referralReason}
                        </p>

                        {/* Metadata */}
                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                          <span
                            className="data-num text-[11px]"
                            style={{ color: '#AAB4BC' }}
                          >
                            Referred {timeAgo(ref.referralDate)}
                          </span>
                          {ref.facilityAppointmentDate && (
                            <span
                              className="data-num text-[11px]"
                              style={{ color: '#AAB4BC' }}
                            >
                              Appt: {formatDate(ref.facilityAppointmentDate)}
                            </span>
                          )}
                        </div>

                        {/* Attendance notes */}
                        {ref.attendanceNotes && (
                          <p className="text-[11px] text-text-hint mt-1 italic">
                            {ref.attendanceNotes}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1.5 shrink-0">
                        {ref.status === 'PENDING' && (
                          <Button
                            size="sm"
                            variant="primary"
                            loading={acting === ref.id}
                            onClick={() => confirm(ref.id)}
                            icon={Edit3}
                          >
                            Confirm
                          </Button>
                        )}
                        {(ref.status === 'CONFIRMED' || ref.status === 'MODIFIED') && (
                          <>
                            <Button
                              size="sm"
                              variant="primary"
                              loading={acting === ref.id}
                              onClick={() => recordAttendance(ref.id, true)}
                              icon={CheckCircle2}
                            >
                              Attended
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              loading={acting === ref.id}
                              onClick={() => recordAttendance(ref.id, false)}
                              icon={XCircle}
                            >
                              No-show
                            </Button>
                          </>
                        )}
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
