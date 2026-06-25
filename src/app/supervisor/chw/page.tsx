'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Badge, { RiskBadge } from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import SortSelect from '@/components/ui/SortSelect';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useTableControls } from '@/lib/useTableControls';
import { MapPin, Users, Activity, TrendingDown, X } from 'lucide-react';

interface Chw {
  id: string;
  fullName: string;
  employeeCode?: string;
  assignedVillage?: string;
  assignedSector?: string;
  activePatients: number;
  totalPatients: number;
  homeVisits30d: number;
  missedDoses7d: number;
  highRiskPatients: number;
  isActive: boolean;
}

interface ChwDetailPatient {
  id: string;
  patientCode: string;
  fullName: string;
  riskLevel?: string;
  recommendedAction?: string;
}

interface ChwDetailVisit {
  id: string;
  patientName?: string;
  visitDate: string;
  adherenceStatus: string;
  pillCountDiscrepancy?: boolean;
}

interface ChwDetail {
  id: string;
  fullName: string;
  employeeCode?: string;
  assignedVillage?: string;
  assignedSector?: string;
  isActive: boolean;
  homeVisits30d: number;
  missedDoses7d: number;
  patients: ChwDetailPatient[];
  recentHomeVisits: ChwDetailVisit[];
}

function performanceBadge(chw: Chw) {
  if (chw.highRiskPatients > 3 || chw.missedDoses7d > 5) return <Badge variant="high">Needs Attention</Badge>;
  if (chw.highRiskPatients > 0 || chw.missedDoses7d > 0)  return <Badge variant="moderate">Monitor</Badge>;
  return <Badge variant="low">Good</Badge>;
}

export default function ChwPage() {
  const [chws, setChws]       = useState<Chw[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ChwDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    api.get('/api/supervisor/dashboard/chws')
      .then((r) => setChws(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) { setDetail(null); return; }
    setDetailLoading(true);
    api.get(`/api/supervisor/dashboard/chws/${selectedId}`)
      .then((r) => setDetail(r.data))
      .catch(console.error)
      .finally(() => setDetailLoading(false));
  }, [selectedId]);

  const active        = chws.filter((c) => c.isActive);
  const totalPatients = chws.reduce((s, c) => s + c.totalPatients, 0);
  const totalVisits   = chws.reduce((s, c) => s + c.homeVisits30d, 0);
  const table = useTableControls(chws, { pageSize: 9 });

  return (
    <DashboardLayout title="CHW Team Performance">
      <div className="space-y-6">

        {/* ── Page header ─────────────────────────────────── */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-text-hint mb-1">
              Supervisor Dashboard
            </p>
            <h1 className="text-[20px] font-bold text-text-primary tracking-tight leading-none">
              CHW Team Performance
            </h1>
          </div>
          <div className="text-right">
            <p className="data-num text-[30px] font-semibold leading-none" style={{ color: '#006D77' }}>
              {active.length}
              <span className="text-[18px] text-text-hint">/{chws.length}</span>
            </p>
            <p className="text-[11px] text-text-hint mt-1 uppercase tracking-wide">CHWs active</p>
          </div>
        </div>

        {/* ── Summary strip ───────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total CHWs',     value: chws.length,   icon: Users,        color: '#006D77' },
            { label: 'Total Patients', value: totalPatients, icon: Activity,     color: '#1A1A2E' },
            { label: 'Visits / 30d',   value: totalVisits,   icon: TrendingDown, color: '#27AE60' },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-xl p-4 text-center"
              style={{ border: '1px solid #DCECF0' }}
            >
              <s.icon size={16} className="mx-auto mb-2" style={{ color: s.color }} />
              <p className="data-num text-[22px] font-semibold leading-none" style={{ color: s.color }}>
                {s.value}
              </p>
              <p className="text-[11px] text-text-hint mt-1 uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── CHW cards ────────────────────────────────────── */}
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {chws.length === 0 && (
              <p className="text-center text-[13px] text-text-hint py-10">No CHWs assigned.</p>
            )}
            {chws.length > 0 && (
              <div className="flex justify-end">
                <SortSelect
                  options={[
                    { key: 'fullName', label: 'Name' },
                    { key: 'activePatients', label: 'Active Patients' },
                    { key: 'missedDoses7d', label: 'Missed Doses (7d)' },
                    { key: 'highRiskPatients', label: 'High Risk' },
                    { key: 'homeVisits30d', label: 'Visits (30d)' },
                  ]}
                  sortKey={table.sortKey}
                  sortDir={table.sortDir}
                  onChange={table.toggleSort}
                />
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {table.paged.map((chw) => (
                <ChwCard key={chw.id} chw={chw} onClick={() => setSelectedId(chw.id)} />
              ))}
            </div>
            <div className="rounded-xl bg-white" style={{ border: '1px solid #DCECF0' }}>
              <Pagination
                page={table.page}
                totalPages={table.totalPages}
                totalItems={table.totalItems}
                pageSize={table.pageSize}
                onPageChange={table.setPage}
              />
            </div>
          </>
        )}
      </div>

      {selectedId && (
        <ChwDetailPanel
          detail={detail}
          loading={detailLoading}
          onClose={() => setSelectedId(null)}
        />
      )}
    </DashboardLayout>
  );
}

function ChwDetailPanel({ detail, loading, onClose }: {
  detail: ChwDetail | null; loading: boolean; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl">
        <div
          className="flex items-center justify-between px-5 py-4 sticky top-0 bg-white"
          style={{ borderBottom: '1px solid #E8F4F8' }}
        >
          <h3 className="text-[14px] font-bold text-text-primary">CHW Detail</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#EDF6F9]">
            <X size={18} className="text-text-hint" />
          </button>
        </div>

        {loading || !detail ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="px-5 py-4 space-y-5">
            <div>
              <p className="text-[15px] font-bold text-text-primary">{detail.fullName}</p>
              <p className="data-num text-[11px] text-text-hint mt-0.5">{detail.employeeCode ?? '—'}</p>
              {(detail.assignedSector || detail.assignedVillage) && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <MapPin size={11} style={{ color: '#AAB4BC' }} />
                  <p className="text-[11px] text-text-hint">
                    {[detail.assignedSector, detail.assignedVillage].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg p-3 text-center" style={{ background: '#EDF6F9', border: '1px solid #DCECF0' }}>
                <p className="data-num text-[18px] font-semibold" style={{ color: '#006D77' }}>{detail.homeVisits30d}</p>
                <p className="text-[10px] text-text-hint uppercase tracking-wide mt-0.5">Visits / 30d</p>
              </div>
              <div className="rounded-lg p-3 text-center" style={{ background: '#EDF6F9', border: '1px solid #DCECF0' }}>
                <p className="data-num text-[18px] font-semibold" style={{ color: detail.missedDoses7d > 5 ? '#C0392B' : '#F39C12' }}>
                  {detail.missedDoses7d}
                </p>
                <p className="text-[10px] text-text-hint uppercase tracking-wide mt-0.5">Missed / 7d</p>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-text-hint mb-2">
                Patients ({detail.patients.length})
              </p>
              {detail.patients.length === 0 ? (
                <p className="text-[12px] text-text-hint">No patients assigned.</p>
              ) : (
                <div className="space-y-2">
                  {detail.patients.map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg px-3 py-2" style={{ border: '1px solid #E8F4F8' }}>
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-medium text-text-primary truncate">{p.fullName}</p>
                        <p className="data-num text-[10px] text-text-hint">{p.patientCode}</p>
                      </div>
                      {p.riskLevel && <RiskBadge level={p.riskLevel} />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-text-hint mb-2">
                Recent Home Visits
              </p>
              {detail.recentHomeVisits.length === 0 ? (
                <p className="text-[12px] text-text-hint">No recent visits.</p>
              ) : (
                <div className="space-y-2">
                  {detail.recentHomeVisits.map((v) => (
                    <div key={v.id} className="flex items-center justify-between gap-2 rounded-lg px-3 py-2" style={{ border: '1px solid #E8F4F8' }}>
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-medium text-text-primary truncate">{v.patientName ?? '—'}</p>
                        <p className="data-num text-[10px] text-text-hint">{formatDate(v.visitDate)}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {v.pillCountDiscrepancy && <Badge variant="high" size="sm">Discrepancy</Badge>}
                        <Badge variant="default" size="sm">{v.adherenceStatus}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ChwCard({ chw, onClick }: { chw: Chw; onClick: () => void }) {
  const patientPct = chw.totalPatients > 0
    ? Math.min((chw.activePatients / chw.totalPatients) * 100, 100)
    : 0;

  const location = [chw.assignedSector, chw.assignedVillage].filter(Boolean).join(', ');

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick(); }}
      className="bg-white rounded-xl overflow-hidden transition-shadow hover:shadow-sm cursor-pointer"
      style={{
        border: '1px solid #DCECF0',
        borderLeft: chw.isActive ? '3px solid #006D77' : '3px solid #DCECF0',
        opacity: chw.isActive ? 1 : 0.55,
      }}
    >
      {/* Card header */}
      <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid #E8F4F8' }}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-bold text-white"
              style={{ background: chw.isActive ? '#006D77' : '#AAB4BC' }}
            >
              {chw.fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-text-primary leading-tight truncate">
                {chw.fullName}
              </p>
              <p className="data-num text-[10px] text-text-hint mt-0.5">
                {chw.employeeCode ?? '—'}
              </p>
            </div>
          </div>
          {performanceBadge(chw)}
        </div>

        {location && (
          <div className="flex items-center gap-1.5 mt-2">
            <MapPin size={11} style={{ color: '#AAB4BC' }} />
            <p className="text-[11px] text-text-hint truncate">{location}</p>
          </div>
        )}
      </div>

      {/* Metrics body */}
      <div className="px-4 py-3 space-y-3">
        {/* Patient load bar */}
        <div>
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-[11px] text-text-hint uppercase tracking-wide">Patients</span>
            <span className="data-num text-[12px] font-semibold text-text-primary">
              {chw.activePatients}
              <span className="text-text-hint font-normal">/{chw.totalPatients}</span>
            </span>
          </div>
          <div
            className="w-full rounded-full overflow-hidden"
            style={{ height: 5, background: '#F5FAFB' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${patientPct}%`,
                background: '#006D77',
              }}
            />
          </div>
        </div>

        {/* Three metric tiles */}
        <div className="grid grid-cols-3 gap-2">
          <MetricTile
            label="Visits/30d"
            value={chw.homeVisits30d}
            color="#006D77"
          />
          <MetricTile
            label="Missed/7d"
            value={chw.missedDoses7d}
            color={chw.missedDoses7d > 5 ? '#C0392B' : chw.missedDoses7d > 0 ? '#F39C12' : '#27AE60'}
          />
          <MetricTile
            label="High Risk"
            value={chw.highRiskPatients}
            color={chw.highRiskPatients > 3 ? '#C0392B' : chw.highRiskPatients > 0 ? '#F39C12' : '#27AE60'}
          />
        </div>
      </div>
    </div>
  );
}

function MetricTile({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="rounded-lg p-2 text-center"
      style={{ background: '#EDF6F9', border: '1px solid #DCECF0' }}
    >
      <p className="data-num text-[16px] font-semibold leading-none" style={{ color }}>
        {value}
      </p>
      <p className="text-[9px] text-text-hint mt-1 uppercase tracking-wide leading-tight">{label}</p>
    </div>
  );
}
