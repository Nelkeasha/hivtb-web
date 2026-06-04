'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/ui/StatCard';
import Card from '@/components/ui/Card';
import { RiskBadge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { riskDot } from '@/lib/utils';
import { Users, AlertCircle, Activity, TrendingDown } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

interface SupervisorStats {
  facilityName: string;
  district?: string;
  totalActivePatients: number;
  highRiskPatients: number;
  criticalAlerts: number;
  activeChws: number;
  totalChws: number;
  totalHomeVisits30d: number;
  totalMissedDoses7d: number;
  facilityAdherenceAvg: number;
}

interface Chw {
  id: string;
  fullName: string;
  employeeCode?: string;
  activePatients: number;
  totalPatients: number;
  homeVisits30d: number;
  missedDoses7d: number;
  highRiskPatients: number;
  isActive: boolean;
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

interface ActivityPoint { day: string; visits: number; missed: number; }

const TOOLTIP_STYLE = {
  borderRadius: 8,
  border: '1px solid #DCECF0',
  fontSize: 12,
  fontFamily: 'Poppins, system-ui, sans-serif',
  boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
  background: '#fff',
};
const AXIS_TICK = { fontSize: 11, fill: '#AAB4BC' };

export default function SupervisorDashboard() {
  const [stats, setStats]           = useState<SupervisorStats | null>(null);
  const [chws, setChws]             = useState<Chw[]>([]);
  const [patients, setPatients]     = useState<Patient[]>([]);
  const [loading, setLoading]       = useState(true);
  const [visitData, setVisitData]   = useState<ActivityPoint[]>([]);

  useEffect(() => {
    Promise.all([
      api.get('/api/supervisor/dashboard/stats'),
      api.get('/api/supervisor/dashboard/chws'),
      api.get('/api/supervisor/dashboard/patients/high-risk'),
      api.get('/api/supervisor/dashboard/activity/weekly'),
    ]).then(([s, c, p, a]) => {
      setStats(s.data);
      setChws((c.data as Chw[]).slice(0, 6));
      setPatients((p.data as Patient[]).slice(0, 6));
      setVisitData(a.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const adherencePct = stats ? Math.round(stats.facilityAdherenceAvg * 100) : 0;

  return (
    <DashboardLayout>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">

          {/* ── Page header ─────────────────────────────────── */}
          {stats && (
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-text-hint mb-1">
                  Supervisor Dashboard
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
                <p className="data-num text-[12px] text-text-secondary mt-0.5">
                  {stats.activeChws}/{stats.totalChws} CHWs active
                </p>
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
            />
            <StatCard
              title="High Risk"
              value={stats?.highRiskPatients ?? 0}
              icon={AlertCircle}
              color="red"
              subtitle="Need attention"
            />
            <StatCard
              title="Visits (30d)"
              value={stats?.totalHomeVisits30d ?? 0}
              icon={Activity}
              color="green"
              subtitle="Home visits"
            />
            <StatCard
              title="Missed (7d)"
              value={stats?.totalMissedDoses7d ?? 0}
              icon={TrendingDown}
              color="amber"
              subtitle="Missed doses"
            />
          </div>

          {/* ── Chart + CHW team ────────────────────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">

            <Card
              className="xl:col-span-2"
              title="Weekly Activity"
              subtitle="Home visits vs missed doses"
            >
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={visitData} margin={{ top: 4, right: 8, left: -26, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gVisits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#006D77" stopOpacity={0.14} />
                      <stop offset="95%" stopColor="#006D77" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gMissed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#E29578" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#E29578" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 6" stroke="#DCECF0" vertical={false} />
                  <XAxis dataKey="day" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ ...AXIS_TICK, fontFamily: "'JetBrains Mono', monospace" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    cursor={{ stroke: '#DCECF0', strokeWidth: 1 }}
                  />
                  <Area
                    type="monotone" dataKey="visits"
                    stroke="#006D77" strokeWidth={2}
                    fill="url(#gVisits)" name="Visits"
                  />
                  <Area
                    type="monotone" dataKey="missed"
                    stroke="#E29578" strokeWidth={1.5}
                    fill="url(#gMissed)" name="Missed Doses"
                    strokeDasharray="5 3"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            {/* CHW team */}
            <Card
              title="CHW Team"
              subtitle={`${chws.length} shown`}
              action={
                <a
                  href="/supervisor/chw"
                  className="text-[12px] font-semibold hover:underline"
                  style={{ color: '#006D77' }}
                >
                  View all →
                </a>
              }
            >
              <div className="space-y-0 max-h-[260px] overflow-y-auto">
                {chws.length === 0 && (
                  <p className="text-[13px] text-text-hint py-6 text-center">No CHWs assigned</p>
                )}
                {chws.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 py-3"
                    style={{ borderBottom: '1px solid #E8F4F8' }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold text-white"
                      style={{ background: c.isActive ? '#006D77' : '#AAB4BC' }}
                    >
                      {c.fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-text-primary truncate">
                        {c.fullName}
                      </p>
                      <p
                        className="text-[10px] mt-0.5"
                        style={{ color: '#AAB4BC', fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {c.activePatients}/{c.totalPatients} pts · {c.homeVisits30d} visits
                      </p>
                    </div>
                    {c.highRiskPatients > 0 && (
                      <span
                        className="data-num text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ background: '#FEF2F2', color: '#C0392B' }}
                      >
                        {c.highRiskPatients}↑
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* ── High-risk patients ───────────────────────────── */}
          <Card
            title="High Risk Patients"
            subtitle="Requiring supervisor attention"
            action={
              <a
                href="/supervisor/analytics"
                className="text-[12px] font-semibold hover:underline"
                style={{ color: '#006D77' }}
              >
                Analytics →
              </a>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #DCECF0' }}>
                    {['Patient', 'Code', 'Risk', 'Score', 'CHW', 'Recommended Action'].map(h => (
                      <th
                        key={h}
                        className="pb-3 pr-6 text-left text-[11px] font-semibold uppercase tracking-widest text-text-hint"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {patients.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-[13px] text-text-hint">
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
