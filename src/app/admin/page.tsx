'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/ui/StatCard';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import SortableTh from '@/components/ui/SortableTh';
import Button from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useTableControls } from '@/lib/useTableControls';
import { downloadReport } from '@/lib/utils';
import { Users, UserCheck, Shield, Activity, FileSpreadsheet } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';

interface AdminReport {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalChw: number;
  totalProviders: number;
  totalSupervisors: number;
  totalPatients: number;
  totalFacilities: number;
  totalActivePatients: number;
  hivOnly: number;
  tbOnly: number;
  hivTbCoinfection: number;
  riskLow: number;
  riskModerate: number;
  riskHigh: number;
  riskCritical: number;
  systemAdherenceAvg: number;
  unresolvedAlerts: number;
  activeLtfuTasks: number;
  ltfuConfirmedCount: number;
  escalatedCount: number;
  facilityBreakdown: Array<{
    facilityName: string;
    district?: string;
    activePatients: number;
    totalChws: number;
    adherenceAvg?: number;
    highRiskPatients: number;
    unresolvedAlerts: number;
  }>;
}

const TOOLTIP_STYLE = {
  borderRadius: 8,
  border: '1px solid #DCECF0',
  fontSize: 12,
  fontFamily: 'Poppins, system-ui, sans-serif',
  boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
  background: '#fff',
};
const AXIS_TICK = { fontSize: 11, fill: '#AAB4BC', fontFamily: 'Poppins, system-ui' };

export default function AdminDashboard() {
  const [report, setReport] = useState<AdminReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const facilityTable = useTableControls(report?.facilityBreakdown ?? []);

  async function handleDownloadExcel() {
    setDownloading(true);
    try {
      await downloadReport('/api/admin/reports/summary/excel', 'admin-report.xlsx');
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  }

  useEffect(() => {
    api.get('/api/admin/reports/summary')
      .then(r => setReport(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <DashboardLayout>
      <div className="flex justify-center items-center py-24">
        <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </DashboardLayout>
  );

  const adherencePct = report ? Math.round(report.systemAdherenceAvg) : 0;

  const riskData = [
    { name: 'Low',      value: report?.riskLow ?? 0,      color: '#27AE60' },
    { name: 'Moderate', value: report?.riskModerate ?? 0, color: '#F39C12' },
    { name: 'High',     value: report?.riskHigh ?? 0,     color: '#E67E22' },
    { name: 'Critical', value: report?.riskCritical ?? 0, color: '#C0392B' },
  ];

  const staffTotal =
    (report?.totalChw ?? 0) + (report?.totalProviders ?? 0) +
    (report?.totalSupervisors ?? 0) + (report?.totalPatients ?? 0);

  const staffBars = [
    { label: 'Community Health Workers', value: report?.totalChw ?? 0,        color: '#006D77' },
    { label: 'Facility Providers',       value: report?.totalProviders ?? 0,   color: '#00919E' },
    { label: 'Supervisors',              value: report?.totalSupervisors ?? 0, color: '#3DCAD4' },
    { label: 'Patient Accounts',         value: report?.totalPatients ?? 0,    color: '#C4E8EB' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* ── Page header ─────────────────────────────────── */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-text-hint mb-1">
              System Administration
            </p>
            <h1 className="text-[20px] font-bold text-text-primary tracking-tight leading-none">
              Dream Medical Center
            </h1>
            <p className="text-[13px] text-text-secondary mt-1">Rwanda · System Overview</p>
          </div>
          <div className="flex items-center gap-5">
            <Button
              variant="secondary"
              size="sm"
              icon={FileSpreadsheet}
              loading={downloading}
              onClick={handleDownloadExcel}
            >
              Export to Excel
            </Button>
            <div className="text-right">
              <p className="data-num text-[30px] font-semibold leading-none" style={{ color: '#006D77' }}>
                {adherencePct}<span className="text-[18px]">%</span>
              </p>
              <p className="text-[11px] text-text-hint mt-1 uppercase tracking-wide">System adherence</p>
            </div>
          </div>
        </div>

        {/* ── KPI row ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard title="Total Users"      value={report?.totalUsers ?? 0}         icon={Users}     color="teal"  subtitle={`${report?.activeUsers ?? 0} active`} />
          <StatCard title="CHW Staff"        value={report?.totalChw ?? 0}           icon={UserCheck} color="green" />
          <StatCard title="Active Patients"  value={report?.totalActivePatients ?? 0} icon={Activity}  color="blue"  />
          <StatCard title="LTFU Cases"       value={report?.activeLtfuTasks ?? 0}    icon={Shield}    color="red"   subtitle={`${report?.ltfuConfirmedCount ?? 0} confirmed`} />
        </div>

        {/* ── Charts ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

          <Card title="Risk Distribution" subtitle="System-wide patient risk levels">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={riskData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 6" stroke="#DCECF0" vertical={false} />
                <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis tick={{ ...AXIS_TICK, fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#EDF6F9' }} />
                <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                  {riskData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Staff Composition" subtitle="Users by role">
            <div className="space-y-4 mt-2">
              {staffBars.map(item => {
                const pct = staffTotal > 0 ? Math.round((item.value / staffTotal) * 100) : 0;
                return (
                  <div key={item.label}>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-[12px] text-text-secondary">{item.label}</span>
                      <span className="data-num text-[12px] font-semibold text-text-primary">{item.value}</span>
                    </div>
                    <div className="w-full h-[5px] rounded-full overflow-hidden" style={{ background: '#F5FAFB' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: item.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* ── Facility table ───────────────────────────────── */}
        {(report?.facilityBreakdown?.length ?? 0) > 0 && (
          <Card
            title="Facility Overview"
            subtitle={`${report!.facilityBreakdown.length} facilities`}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #DCECF0' }}>
                    <SortableTh label="Facility" sortKey="facilityName" activeSortKey={facilityTable.sortKey} sortDir={facilityTable.sortDir} onSort={facilityTable.toggleSort} />
                    <SortableTh label="District" sortKey="district" activeSortKey={facilityTable.sortKey} sortDir={facilityTable.sortDir} onSort={facilityTable.toggleSort} />
                    <SortableTh label="Patients" sortKey="activePatients" activeSortKey={facilityTable.sortKey} sortDir={facilityTable.sortDir} onSort={facilityTable.toggleSort} />
                    <SortableTh label="CHWs" sortKey="totalChws" activeSortKey={facilityTable.sortKey} sortDir={facilityTable.sortDir} onSort={facilityTable.toggleSort} />
                    <SortableTh label="Adherence" sortKey="adherenceAvg" activeSortKey={facilityTable.sortKey} sortDir={facilityTable.sortDir} onSort={facilityTable.toggleSort} />
                    <SortableTh label="High Risk" sortKey="highRiskPatients" activeSortKey={facilityTable.sortKey} sortDir={facilityTable.sortDir} onSort={facilityTable.toggleSort} />
                    <SortableTh label="Alerts" sortKey="unresolvedAlerts" activeSortKey={facilityTable.sortKey} sortDir={facilityTable.sortDir} onSort={facilityTable.toggleSort} className="pr-0" />
                  </tr>
                </thead>
                <tbody>
                  {facilityTable.paged.map((f, i) => (
                    <tr key={i} className="table-row-hover" style={{ borderBottom: '1px solid #E8F4F8' }}>
                      <td className="py-3 pr-6 text-[13px] font-semibold text-text-primary">{f.facilityName}</td>
                      <td className="py-3 pr-6 text-[13px] text-text-secondary">{f.district ?? '—'}</td>
                      <td className="py-3 pr-6 data-num text-[13px] font-semibold" style={{ color: '#006D77' }}>{f.activePatients}</td>
                      <td className="py-3 pr-6 data-num text-[13px] text-text-secondary">{f.totalChws}</td>
                      <td className="py-3 pr-6">
                        {f.adherenceAvg != null ? (
                          <span className="data-num text-[13px] font-semibold" style={{
                            color: f.adherenceAvg >= 80 ? '#27AE60' : f.adherenceAvg >= 60 ? '#F39C12' : '#C0392B',
                          }}>
                            {Math.round(f.adherenceAvg)}%
                          </span>
                        ) : <span className="text-[13px] text-text-hint">—</span>}
                      </td>
                      <td className="py-3 pr-6">
                        <span className="data-num text-[13px] font-semibold" style={{ color: f.highRiskPatients > 0 ? '#C0392B' : '#27AE60' }}>
                          {f.highRiskPatients}
                        </span>
                      </td>
                      <td className="py-3">
                        {f.unresolvedAlerts > 0
                          ? <Badge variant="high">{f.unresolvedAlerts}</Badge>
                          : <Badge variant="low">0</Badge>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              className="-mx-6 -mb-6 mt-4"
              page={facilityTable.page}
              totalPages={facilityTable.totalPages}
              totalItems={facilityTable.totalItems}
              pageSize={facilityTable.pageSize}
              onPageChange={facilityTable.setPage}
            />
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
