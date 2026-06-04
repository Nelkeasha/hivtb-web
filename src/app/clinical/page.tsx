'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/ui/StatCard';
import Card from '@/components/ui/Card';
import Badge, { RiskBadge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { timeAgo, riskDot } from '@/lib/utils';
import {
  Users, AlertCircle, Activity, TrendingDown, CheckCircle2,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface FacilityStats {
  totalActivePatients: number;
  totalChws: number;
  activeTreatmentPlans: number;
  highRiskPatientCount: number;
  criticalAlertCount: number;
  facilityAdherenceAvg: number;
  facilityName: string;
  district?: string;
}

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

interface Patient {
  id: string;
  fullName: string;
  patientCode: string;
  diagnosisType?: string;
  riskLevel: string;
  riskScore: number;
  chwName?: string;
  recommendedAction?: string;
}

interface TrendPoint { day: string; adherence: number; confirmed: number; }

const TOOLTIP_STYLE = {
  borderRadius: 8,
  border: '1px solid #DCECF0',
  fontSize: 12,
  fontFamily: 'Poppins, system-ui, sans-serif',
  boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
  background: '#fff',
};
const AXIS_TICK = { fontSize: 11, fill: '#AAB4BC' };

export default function ClinicalDashboard() {
  const [stats, setStats]       = useState<FacilityStats | null>(null);
  const [alerts, setAlerts]     = useState<Alert[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/clinical/dashboard/stats'),
      api.get('/api/alerts/clinical'),
      api.get('/api/clinical/dashboard/patients'),
      api.get('/api/clinical/dashboard/adherence/trend'),
    ]).then(([s, a, p, t]) => {
      setStats(s.data);
      setAlerts((a.data as Alert[]).filter(al => !al.isResolved).slice(0, 6));
      setPatients((p.data as Patient[])
        .filter(pt => pt.riskLevel === 'HIGH' || pt.riskLevel === 'CRITICAL')
        .slice(0, 8));
      setTrendData(t.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const adherencePct = stats ? Math.round(stats.facilityAdherenceAvg * 100) : 0;

  async function resolveAlert(id: string) {
    await api.put(`/api/alerts/${id}/resolve`, {});
    setAlerts(prev => prev.filter(a => a.id !== id));
  }

  return (
    <DashboardLayout>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">

          {/* ── Page header ────────────────────────────────── */}
          {stats && (
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-text-hint mb-1">
                  Clinical Dashboard
                </p>
                <h1 className="text-[20px] font-bold text-text-primary tracking-tight leading-none">
                  {stats.facilityName}
                </h1>
                {stats.district && (
                  <p className="text-[13px] text-text-secondary mt-1">{stats.district}</p>
                )}
              </div>
              <div className="text-right">
                <p
                  className="data-num text-[30px] font-semibold leading-none"
                  style={{
                    color: adherencePct >= 80 ? '#27AE60' :
                           adherencePct >= 60 ? '#F39C12' : '#C0392B',
                  }}
                >
                  {adherencePct}<span className="text-[18px]">%</span>
                </p>
                <p className="text-[11px] text-text-hint mt-1 uppercase tracking-wide">Facility adherence</p>
              </div>
            </div>
          )}

          {/* ── KPI row ─────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              title="Active Patients"
              value={stats?.totalActivePatients ?? 0}
              icon={Users}
              color="teal"
              subtitle="Enrolled & active"
            />
            <StatCard
              title="High Risk"
              value={stats?.highRiskPatientCount ?? 0}
              icon={AlertCircle}
              color="red"
              subtitle="Need attention"
            />
            <StatCard
              title="Critical Alerts"
              value={stats?.criticalAlertCount ?? 0}
              icon={Activity}
              color="coral"
              subtitle="Unresolved"
            />
            <StatCard
              title="Adherence"
              value={`${adherencePct}%`}
              icon={TrendingDown}
              color={adherencePct >= 80 ? 'green' : adherencePct >= 60 ? 'amber' : 'red'}
              subtitle="Facility average"
            />
          </div>

          {/* ── Chart + Alerts ──────────────────────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">

            <Card
              className="xl:col-span-2"
              title="7-Day Adherence Trend"
              subtitle="Daily dose confirmation rate across all patients"
            >
              <ResponsiveContainer width="100%" height={228}>
                <LineChart data={trendData} margin={{ top: 4, right: 8, left: -26, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 6" stroke="#DCECF0" vertical={false} />
                  <XAxis dataKey="day" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ ...AXIS_TICK, fontFamily: "'JetBrains Mono', monospace" }}
                    domain={[50, 100]}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    cursor={{ stroke: '#DCECF0', strokeWidth: 1 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Line
                    type="monotone" dataKey="adherence"
                    stroke="#006D77" strokeWidth={2}
                    dot={false} name="Adherence %"
                  />
                  <Line
                    type="monotone" dataKey="confirmed"
                    stroke="#E29578" strokeWidth={1.5}
                    dot={false} name="Confirmed %"
                    strokeDasharray="5 3"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Active alerts */}
            <Card title="Active Alerts" subtitle={`${alerts.length} unresolved`}>
              <div className="space-y-0 max-h-[260px] overflow-y-auto">
                {alerts.length === 0 && (
                  <div className="flex flex-col items-center py-8 text-text-hint">
                    <CheckCircle2 size={28} className="mb-2" />
                    <p className="text-[13px] font-medium">All clear</p>
                    <p className="text-[11px] mt-0.5">No unresolved alerts</p>
                  </div>
                )}
                {alerts.map(alert => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 py-3 group"
                    style={{ borderBottom: '1px solid #E8F4F8' }}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-[5px] shrink-0"
                      style={{ background: alert.severity === 'CRITICAL' ? '#C0392B' : '#F39C12' }}
                    />
                    <div className="flex-1 min-w-0">
                      {alert.patientName && (
                        <p className="text-[13px] font-semibold text-text-primary truncate">
                          {alert.patientName}
                        </p>
                      )}
                      <p className="text-[12px] text-text-secondary truncate mt-0.5">{alert.title}</p>
                      <p
                        className="text-[11px] mt-1"
                        style={{ color: '#AAB4BC', fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {timeAgo(alert.createdAt)}
                      </p>
                    </div>
                    <button
                      onClick={() => resolveAlert(alert.id)}
                      title="Resolve"
                      className="opacity-0 group-hover:opacity-100 transition-opacity mt-0.5"
                      style={{ color: '#AAB4BC' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#006D77'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#AAB4BC'; }}
                    >
                      <CheckCircle2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* ── High-risk patients ───────────────────────────── */}
          <Card
            title="High Risk Patients"
            subtitle="Patients requiring immediate clinical attention"
            action={
              <a
                href="/clinical/patients"
                className="text-[12px] font-semibold hover:underline"
                style={{ color: '#006D77' }}
              >
                View all →
              </a>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #DCECF0' }}>
                    {['Patient', 'Code', 'Diagnosis', 'Risk', 'Score', 'CHW', 'Recommended Action'].map(h => (
                      <th key={h} className="pb-3 pr-6 text-left text-[11px] font-semibold uppercase tracking-widest text-text-hint">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {patients.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-[13px] text-text-hint">
                        No high-risk patients
                      </td>
                    </tr>
                  )}
                  {patients.map(p => (
                    <tr
                      key={p.id}
                      className="table-row-hover transition-colors cursor-pointer"
                      style={{ borderBottom: '1px solid #E8F4F8' }}
                    >
                      <td className="py-3 pr-6">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${riskDot(p.riskLevel)}`} />
                          <span className="text-[13px] font-semibold text-text-primary">{p.fullName}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-6 data-num text-[12px] text-text-hint">
                        {p.patientCode}
                      </td>
                      <td className="py-3 pr-6">
                        <Badge variant="default" size="sm">
                          {p.diagnosisType?.replace('_', '+') ?? '—'}
                        </Badge>
                      </td>
                      <td className="py-3 pr-6"><RiskBadge level={p.riskLevel} /></td>
                      <td className="py-3 pr-6 data-num text-[13px] font-semibold text-text-primary">
                        {p.riskScore.toFixed(0)}
                      </td>
                      <td className="py-3 pr-6 text-[12px] text-text-secondary">{p.chwName ?? '—'}</td>
                      <td className="py-3 text-[12px] text-text-secondary max-w-[160px] truncate">
                        {p.recommendedAction ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

        </div>
      )}
    </DashboardLayout>
  );
}
