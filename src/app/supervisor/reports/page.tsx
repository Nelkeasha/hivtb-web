'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/ui/StatCard';
import Card from '@/components/ui/Card';
import ExportMenu from '@/components/ui/ExportMenu';
import { api, extractErrorMessage } from '@/lib/api';
import { Users, Activity, TrendingDown, UserCheck } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

interface SupervisorReport {
  totalChws: number;
  activeChws: number;
  inactiveChws: number;
  totalActivePatients: number;
  hivOnly: number;
  tbOnly: number;
  hivTbCoinfection: number;
  riskLow: number;
  riskModerate: number;
  riskHigh: number;
  riskCritical: number;
  facilityAdherenceAvg: number;
  belowThresholdCount: number;
  totalHomeVisits30d: number;
  totalMissedDoses7d: number;
  unresolvedAlerts: number;
}

const TOOLTIP_STYLE = {
  borderRadius: 8,
  border: '1px solid #DCECF0',
  fontSize: 12,
  fontFamily: 'Poppins, system-ui, sans-serif',
  boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
  background: '#fff',
};
const AXIS_TICK = { fontSize: 11, fill: '#AAB4BC' };

export default function SupervisorReportPage() {
  const [report, setReport] = useState<SupervisorReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    api.get('/api/supervisor/dashboard/reports/summary')
      .then((r) => setReport(r.data))
      .catch(e => setApiError(extractErrorMessage(e, 'Failed to load report data. Try refreshing.')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <DashboardLayout title="Supervisor Report">
      <div className="flex justify-center py-20">
        <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </DashboardLayout>
  );

  if (!report) return (
    <DashboardLayout title="Supervisor Report">
      <div className="text-center py-20">
        <p className="text-[13px] font-semibold" style={{ color: '#E8714A' }}>
          {apiError || 'Could not load report data'}
        </p>
        <p className="text-[12px] text-text-hint mt-1">
          Try refreshing the page. If the problem persists, the server may be starting up.
        </p>
      </div>
    </DashboardLayout>
  );

  const adherencePct = Math.round(report.facilityAdherenceAvg);

  const riskData = [
    { name: 'Low',      value: report.riskLow,      color: '#27AE60' },
    { name: 'Moderate', value: report.riskModerate,  color: '#F39C12' },
    { name: 'High',     value: report.riskHigh,      color: '#E67E22' },
    { name: 'Critical', value: report.riskCritical,  color: '#C0392B' },
  ];

  const diagData = [
    { name: 'HIV',    value: report.hivOnly,          color: '#E8714A' },
    { name: 'TB',     value: report.tbOnly,            color: '#00919E' },
    { name: 'HIV+TB', value: report.hivTbCoinfection,  color: '#3DCAD4' },
  ];

  const indicators = [
    { label: 'Below Adherence Threshold', value: report.belowThresholdCount,  warn: report.belowThresholdCount > 0  },
    { label: 'Missed Doses (7d)',          value: report.totalMissedDoses7d,   warn: report.totalMissedDoses7d > 0   },
    { label: 'Unresolved Alerts',          value: report.unresolvedAlerts,     warn: report.unresolvedAlerts > 0     },
    { label: 'HIV Only',                   value: report.hivOnly,              warn: false },
    { label: 'TB Only',                    value: report.tbOnly,               warn: false },
    { label: 'HIV + TB Co-infection',      value: report.hivTbCoinfection,     warn: false },
  ];

  return (
    <DashboardLayout title="Supervisor Report">
      <div className="space-y-6">

        {/* ── Page header ─────────────────────────────────── */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-text-hint mb-1">
              Supervisor Dashboard
            </p>
            <h1 className="text-[20px] font-bold text-text-primary tracking-tight leading-none">
              Programme Report
            </h1>
          </div>
          <div className="flex items-center gap-5">
            <ExportMenu
              baseUrl="/api/supervisor/dashboard/reports/summary/export"
              filenamePrefix="supervisor-report"
            />
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
              <p className="text-[11px] text-text-hint mt-1 uppercase tracking-wide">
                Facility adherence
              </p>
            </div>
          </div>
        </div>

        {/* ── KPI row ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            title="Active CHWs"
            value={`${report.activeChws}/${report.totalChws}`}
            icon={UserCheck}
            color="teal"
            subtitle={`${report.inactiveChws} inactive`}
          />
          <StatCard
            title="Patients"
            value={report.totalActivePatients}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Adherence"
            value={`${adherencePct}%`}
            icon={TrendingDown}
            color={adherencePct >= 80 ? 'green' : 'amber'}
            subtitle="Facility average"
          />
          <StatCard
            title="Visits (30d)"
            value={report.totalHomeVisits30d}
            icon={Activity}
            color="green"
            subtitle="Home visits"
          />
        </div>

        {/* ── Charts ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

          <Card title="Risk Distribution" subtitle="Patients by risk level">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={riskData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 6" stroke="#DCECF0" vertical={false} />
                <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ ...AXIS_TICK, fontFamily: "'JetBrains Mono', monospace" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#EDF6F9' }} />
                <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                  {riskData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Diagnosis Breakdown" subtitle="Active patients by diagnosis type">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={diagData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 6" stroke="#DCECF0" vertical={false} />
                <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ ...AXIS_TICK, fontFamily: "'JetBrains Mono', monospace" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#EDF6F9' }} />
                <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                  {diagData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* ── Programme indicators ─────────────────────────── */}
        <Card title="Programme Indicators" subtitle="Key operational metrics">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {indicators.map((item) => (
              <div
                key={item.label}
                className="rounded-lg p-3 text-center"
                style={{
                  background: item.warn ? 'rgba(194,40,40,0.03)' : '#EDF6F9',
                  border: `1px solid ${item.warn ? '#FECACA' : '#DCECF0'}`,
                }}
              >
                <p
                  className="data-num text-[20px] font-semibold leading-none"
                  style={{ color: item.warn ? '#C0392B' : '#E8714A' }}
                >
                  {item.value}
                </p>
                <p className="text-[10px] text-text-hint mt-1.5 leading-tight uppercase tracking-wide">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </Card>

      </div>
    </DashboardLayout>
  );
}
