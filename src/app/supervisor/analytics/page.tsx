'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/ui/StatCard';
import Card from '@/components/ui/Card';
import Pagination from '@/components/ui/Pagination';
import SortableTh from '@/components/ui/SortableTh';
import { api, extractErrorMessage } from '@/lib/api';
import ApiErrorBanner from '@/components/ui/ApiErrorBanner';
import { useTableControls } from '@/lib/useTableControls';
import { Users, TrendingDown, Activity, AlertCircle } from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface SupervisorStats {
  totalActivePatients: number;
  highRiskPatients: number;
  criticalAlerts: number;
  totalHomeVisits30d: number;
  totalMissedDoses7d: number;
  facilityAdherenceAvg: number;
  activeChws: number;
  totalChws: number;
}

interface Chw {
  id: string;
  fullName: string;
  activePatients: number;
  homeVisits30d: number;
  missedDoses7d: number;
  highRiskPatients: number;
}

const TOOLTIP_STYLE = {
  borderRadius: 8,
  border: '1px solid #E9E9E9',
  fontSize: 12,
  fontFamily: 'Poppins, system-ui, sans-serif',
  boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
  background: '#fff',
};
const AXIS_TICK = { fontSize: 11, fill: '#9CA3AF' };

export default function AnalyticsPage() {
  const [stats, setStats]   = useState<SupervisorStats | null>(null);
  const [chws, setChws]     = useState<Chw[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const table = useTableControls(chws);

  useEffect(() => {
    Promise.all([
      api.get('/api/supervisor/dashboard/stats'),
      api.get('/api/supervisor/dashboard/chws'),
    ]).then(([s, c]) => {
      setStats(s.data);
      setChws(c.data);
    }).catch(e => setApiError(extractErrorMessage(e, 'Failed to load analytics data. Try refreshing.')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <DashboardLayout title="Population Analytics">
      <div className="flex justify-center py-20">
        <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </DashboardLayout>
  );

  const adherencePct = stats ? Math.round(stats.facilityAdherenceAvg) : 0;

  const chwBarData = chws.slice(0, 8).map((c) => ({
    name: c.fullName.split(' ')[0],
    visits: c.homeVisits30d,
    missed: c.missedDoses7d,
  }));

  const radarData = [
    { metric: 'Adherence',  value: adherencePct },
    { metric: 'Visits',     value: Math.min((stats?.totalHomeVisits30d ?? 0) / 2, 100) },
    { metric: 'CHW Active', value: stats ? Math.round((stats.activeChws / Math.max(stats.totalChws, 1)) * 100) : 0 },
    { metric: 'Low Risk',   value: stats && stats.totalActivePatients > 0
        ? Math.round(((stats.totalActivePatients - stats.highRiskPatients) / stats.totalActivePatients) * 100)
        : 0 },
    { metric: 'Alerts',     value: Math.max(0, 100 - (stats?.criticalAlerts ?? 0) * 5) },
  ];

  return (
    <DashboardLayout title="Population Analytics">
      <div className="space-y-6">
        {apiError && <ApiErrorBanner message={apiError} onDismiss={() => setApiError('')} />}

        {/* ── Page header ─────────────────────────────────── */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-text-hint mb-1">
              Supervisor Dashboard
            </p>
            <h1 className="text-[20px] font-bold text-text-primary tracking-tight leading-none">
              Population Analytics
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
          <StatCard title="Total Patients"  value={stats?.totalActivePatients ?? 0} icon={Users}         color="teal" />
          <StatCard title="Adherence Avg"   value={`${adherencePct}%`}              icon={TrendingDown}
            color={adherencePct >= 80 ? 'green' : 'amber'} />
          <StatCard title="Visits (30d)"    value={stats?.totalHomeVisits30d ?? 0}  icon={Activity}      color="green" />
          <StatCard title="Critical Alerts" value={stats?.criticalAlerts ?? 0}       icon={AlertCircle}   color="red" />
        </div>

        {/* ── Charts row ──────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

          {/* Programme health radar */}
          <Card
            title="Programme Health Score"
            subtitle="Overall performance indicators (normalised to 100)"
          >
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
                <PolarGrid stroke="#E9E9E9" />
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{ fontSize: 11, fill: '#9CA3AF', fontFamily: 'Poppins, system-ui' }}
                />
                <Radar
                  name="Score"
                  dataKey="value"
                  stroke="#E64B2E"
                  fill="#E64B2E"
                  fillOpacity={0.12}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(v) => [`${v}%`, 'Score']}
                />
              </RadarChart>
            </ResponsiveContainer>
          </Card>

          {/* CHW activity bar chart */}
          <Card
            title="CHW Activity (30 days)"
            subtitle="Home visits and missed doses per CHW"
          >
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chwBarData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 6" stroke="#E9E9E9" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ ...AXIS_TICK, fontFamily: 'Poppins, system-ui' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ ...AXIS_TICK, fontFamily: "'JetBrains Mono', monospace" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  cursor={{ fill: '#FAFAFA' }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Bar dataKey="visits" name="Visits"       fill="#E64B2E" radius={[3, 3, 0, 0]} />
                <Bar dataKey="missed" name="Missed Doses" fill="#E29578" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* ── CHW performance table ────────────────────────── */}
        <Card
          title="CHW Detailed Metrics"
          subtitle={`${chws.length} community health workers`}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #E9E9E9' }}>
                  <SortableTh label="CHW" sortKey="fullName" activeSortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <SortableTh label="Patients" sortKey="activePatients" activeSortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <SortableTh label="Visits / 30d" sortKey="homeVisits30d" activeSortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <SortableTh label="Missed / 7d" sortKey="missedDoses7d" activeSortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} />
                  <SortableTh label="High Risk" sortKey="highRiskPatients" activeSortKey={table.sortKey} sortDir={table.sortDir} onSort={table.toggleSort} className="pr-0" />
                </tr>
              </thead>
              <tbody>
                {chws.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-[13px] text-text-hint">
                      No CHW data
                    </td>
                  </tr>
                )}
                {table.paged.map((c) => (
                  <tr
                    key={c.id}
                    className="table-row-hover transition-colors"
                    style={{ borderBottom: '1px solid #F0F0F0' }}
                  >
                    <td className="py-3 pr-6 text-[13px] font-semibold text-text-primary">
                      {c.fullName}
                    </td>
                    <td className="py-3 pr-6 data-num text-[13px] text-text-secondary">
                      {c.activePatients}
                    </td>
                    <td className="py-3 pr-6">
                      <span
                        className="data-num text-[13px] font-semibold"
                        style={{ color: '#E64B2E' }}
                      >
                        {c.homeVisits30d}
                      </span>
                    </td>
                    <td className="py-3 pr-6">
                      <span
                        className="data-num text-[13px] font-semibold"
                        style={{
                          color: c.missedDoses7d > 5 ? '#C0392B' :
                                 c.missedDoses7d > 0 ? '#F39C12' : '#27AE60',
                        }}
                      >
                        {c.missedDoses7d}
                      </span>
                    </td>
                    <td className="py-3">
                      <span
                        className="data-num text-[13px] font-semibold"
                        style={{
                          color: c.highRiskPatients > 3 ? '#C0392B' :
                                 c.highRiskPatients > 0 ? '#F39C12' : '#27AE60',
                        }}
                      >
                        {c.highRiskPatients}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            className="-mx-6 -mb-6 mt-4"
            page={table.page}
            totalPages={table.totalPages}
            totalItems={table.totalItems}
            pageSize={table.pageSize}
            onPageChange={table.setPage}
          />
        </Card>

      </div>
    </DashboardLayout>
  );
}
