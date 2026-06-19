'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/ui/StatCard';
import Card from '@/components/ui/Card';
import { api } from '@/lib/api';
import { Users, TrendingUp, AlertCircle, ArrowLeftRight } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

interface Report {
  totalActivePatients: number;
  hivOnly: number;
  tbOnly: number;
  hivTbCoinfection: number;
  riskLow: number;
  riskModerate: number;
  riskHigh: number;
  riskCritical: number;
  riskUnscored: number;
  facilityAdherenceAvg: number;
  belowThresholdCount: number;
  falseConfirmationFlagCount: number;
  unresolvedAlerts: number;
  criticalAlerts: number;
  warningAlerts: number;
  missedDoseAlerts: number;
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
const AXIS_TICK_MONO = { fontSize: 11, fill: '#AAB4BC', fontFamily: "'JetBrains Mono', monospace" };

export default function ReportsPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/clinical/dashboard/reports/summary')
      .then((r) => setReport(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <DashboardLayout title="Facility Report">
      <div className="flex justify-center py-20">
        <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </DashboardLayout>
  );

  if (!report) return (
    <DashboardLayout title="Facility Report">
      <div className="text-center py-20 text-[13px] text-text-hint">Could not load report</div>
    </DashboardLayout>
  );

  const adherencePct = Math.round(report.facilityAdherenceAvg);

  const diagnosisData = [
    { name: 'HIV',    value: report.hivOnly,         fill: '#006D77' },
    { name: 'TB',     value: report.tbOnly,           fill: '#00919E' },
    { name: 'HIV+TB', value: report.hivTbCoinfection, fill: '#3DCAD4' },
  ];

  const riskData = [
    { name: 'Low',      value: report.riskLow,      color: '#27AE60' },
    { name: 'Moderate', value: report.riskModerate,  color: '#F39C12' },
    { name: 'High',     value: report.riskHigh,      color: '#E67E22' },
    { name: 'Critical', value: report.riskCritical,  color: '#C0392B' },
    { name: 'Unscored', value: report.riskUnscored,  color: '#C8C4BC' },
  ];

  const alertData = [
    { name: 'Missed Dose', count: report.missedDoseAlerts, fill: '#F39C12' },
    { name: 'Warning',     count: report.warningAlerts,    fill: '#E67E22' },
    { name: 'Critical',    count: report.criticalAlerts,   fill: '#C0392B' },
  ];

  const indicators = [
    { label: 'HIV Only',            value: report.hivOnly,                    warn: false },
    { label: 'TB Only',             value: report.tbOnly,                     warn: false },
    { label: 'HIV+TB Co-infection', value: report.hivTbCoinfection,           warn: false },
    { label: 'False Confirm Flags', value: report.falseConfirmationFlagCount, warn: report.falseConfirmationFlagCount > 0 },
    { label: 'Missed Dose Alerts',  value: report.missedDoseAlerts,           warn: report.missedDoseAlerts > 0 },
  ];

  return (
    <DashboardLayout title="Facility Report">
      <div className="space-y-6">

        {/* ── Page header ─────────────────────────────────── */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-text-hint mb-1">
              Clinical Dashboard
            </p>
            <h1 className="text-[20px] font-bold text-text-primary tracking-tight leading-none">
              Facility Report
            </h1>
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
            <p className="text-[11px] text-text-hint mt-1 uppercase tracking-wide">
              Facility adherence
            </p>
          </div>
        </div>

        {/* ── KPI row ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            title="Active Patients"
            value={report.totalActivePatients}
            icon={Users}
            color="teal"
          />
          <StatCard
            title="Adherence Avg"
            value={`${adherencePct}%`}
            icon={TrendingUp}
            color={adherencePct >= 80 ? 'green' : 'amber'}
            subtitle="Facility average"
          />
          <StatCard
            title="Unresolved Alerts"
            value={report.unresolvedAlerts}
            icon={AlertCircle}
            color="red"
          />
          <StatCard
            title="Below Threshold"
            value={report.belowThresholdCount}
            icon={ArrowLeftRight}
            color="amber"
            subtitle="Adherence threshold"
          />
        </div>

        {/* ── Charts row ──────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

          {/* Diagnosis donut */}
          <Card title="Patient Diagnosis" subtitle="Breakdown by diagnosis type">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={diagnosisData}
                  cx="50%" cy="50%"
                  innerRadius={52} outerRadius={76}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {diagnosisData.map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend
                  wrapperStyle={{
                    fontSize: 11,
                    fontFamily: 'Poppins, system-ui, sans-serif',
                    paddingTop: 8,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Risk bar chart */}
          <Card title="Risk Distribution" subtitle="Patients by risk level">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={riskData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 6" stroke="#DCECF0" vertical={false} />
                <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_TICK_MONO} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#EDF6F9' }} />
                <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                  {riskData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Alert horizontal bar */}
          <Card title="Alert Summary" subtitle="Unresolved by type">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={alertData}
                layout="vertical"
                margin={{ top: 4, right: 12, left: 16, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="2 6" stroke="#DCECF0" horizontal={false} />
                <XAxis
                  type="number"
                  tick={AXIS_TICK_MONO}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={AXIS_TICK}
                  axisLine={false}
                  tickLine={false}
                  width={76}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#EDF6F9' }} />
                <Bar dataKey="count" radius={[0, 3, 3, 0]}>
                  {alertData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* ── Key indicators ───────────────────────────────── */}
        <Card title="Key Indicators" subtitle="Operational summary">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
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
                  style={{ color: item.warn ? '#C0392B' : '#006D77' }}
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
