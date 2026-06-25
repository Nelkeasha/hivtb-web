'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Badge, { RiskBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import SortableTh from '@/components/ui/SortableTh';
import SortSelect from '@/components/ui/SortSelect';
import { api, extractErrorMessage } from '@/lib/api';
import ApiErrorBanner from '@/components/ui/ApiErrorBanner';
import { riskDot } from '@/lib/utils';
import { useTableControls } from '@/lib/useTableControls';
import { Search, Plus, AlertCircle } from 'lucide-react';

const RISK_RANK: Record<string, number> = { CRITICAL: 3, HIGH: 2, MODERATE: 1, LOW: 0 };

interface Patient {
  id: string; fullName: string; patientCode: string;
  diagnosisType?: string; riskLevel: string; riskScore: number;
  chwName?: string; village?: string; recommendedAction?: string;
  registrationStatus?: string; referralId?: string; suspectedCondition?: string;
}

type Tab = 'active' | 'provisional';

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients]       = useState<Patient[]>([]);
  const [provisional, setProvisional] = useState<Patient[]>([]);
  const [tab, setTab]                 = useState<Tab>('active');
  const [search, setSearch]           = useState('');
  const [riskFilter, setRiskFilter]   = useState('ALL');
  const [loading, setLoading]         = useState(true);
  const [apiError, setApiError]       = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/api/clinical/dashboard/patients'),
      api.get('/api/v1/patients/provisional'),
    ]).then(([ar, pr]) => {
      setPatients(ar.data);
      setProvisional(pr.data);
    }).catch(e => setApiError(extractErrorMessage(e, 'Failed to load patients. Try refreshing.')))
      .finally(() => setLoading(false));
  }, []);

  const filtered = patients
    .filter((p) => riskFilter === 'ALL' || p.riskLevel === riskFilter)
    .filter((p) =>
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.patientCode.toLowerCase().includes(search.toLowerCase())
    );

  const filteredProv = provisional.filter((p) =>
    p.fullName.toLowerCase().includes(search.toLowerCase()) ||
    (p.referralId ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const activeTable = useTableControls(filtered, {
    getSortValue: (p, key) => (key === 'riskLevel' ? RISK_RANK[p.riskLevel] ?? -1 : (p as unknown as Record<string, string | number>)[key]),
  });
  const provTable = useTableControls(filteredProv);

  return (
    <DashboardLayout title="Patients">
      {apiError && <ApiErrorBanner message={apiError} onDismiss={() => setApiError('')} className="mb-4" />}
      {/* ── Page header + register button ───────────────────── */}
      <div className="flex items-end justify-between mb-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-text-hint mb-1">
            Clinical Dashboard
          </p>
          <h1 className="text-[20px] font-bold text-text-primary tracking-tight leading-none">
            Patient Registry
          </h1>
        </div>
        <Button size="sm" icon={Plus} onClick={() => router.push('/clinical/patients/register')}>
          Register Patient
        </Button>
      </div>

      {/* ── Tabs ────────────────────────────────────────────── */}
      <div
        className="inline-flex gap-1 p-1 rounded-lg mb-4"
        style={{ background: '#F5FAFB', border: '1px solid #DCECF0' }}
      >
        <TabBtn active={tab === 'active'} onClick={() => { setTab('active'); setSearch(''); }}>
          Active Patients
          {patients.length > 0 && (
            <span className="data-num ml-1.5 text-[10px]" style={{ opacity: 0.6 }}>
              ({patients.length})
            </span>
          )}
        </TabBtn>
        <TabBtn active={tab === 'provisional'} onClick={() => { setTab('provisional'); setSearch(''); }}>
          Awaiting Confirmation
          {provisional.length > 0 && (
            <span
              className="ml-1.5 data-num text-[10px] font-bold px-1.5 py-0.5 rounded text-white"
              style={{ background: '#F39C12' }}
            >
              {provisional.length}
            </span>
          )}
        </TabBtn>
      </div>

      {/* ── Active patients table ────────────────────────────── */}
      {tab === 'active' && (
        <Card
          title="Active Patients"
          subtitle={`${filtered.length} patients`}
          action={
            <div className="flex items-center gap-2 flex-wrap">
              {/* Risk filter pills */}
              <div className="flex gap-1">
                {['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRiskFilter(r)}
                    className="text-[11px] px-2.5 py-1 rounded font-semibold transition-colors"
                    style={{
                      background: riskFilter === r ? '#E8714A' : '#EDF6F9',
                      color: riskFilter === r ? '#fff' : '#5A6474',
                      border: `1px solid ${riskFilter === r ? '#E8714A' : '#DCECF0'}`,
                    }}
                  >
                    {r === 'ALL' ? 'All' : r.charAt(0) + r.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
              {/* Search */}
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-hint pointer-events-none" />
                <input
                  className="pl-8 pr-3 py-1.5 text-[12px] rounded-lg bg-white outline-none w-36"
                  style={{ border: '1px solid #DCECF0' }}
                  placeholder="Search…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = '#E8714A'; }}
                  onBlur={e  => { (e.currentTarget as HTMLInputElement).style.borderColor = '#DCECF0'; }}
                />
              </div>
            </div>
          }
        >
          {loading ? <Spinner /> : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #DCECF0' }}>
                    <SortableTh label="Patient" sortKey="fullName" activeSortKey={activeTable.sortKey} sortDir={activeTable.sortDir} onSort={activeTable.toggleSort} className="whitespace-nowrap" />
                    <SortableTh label="Code" sortKey="patientCode" activeSortKey={activeTable.sortKey} sortDir={activeTable.sortDir} onSort={activeTable.toggleSort} className="whitespace-nowrap" />
                    <SortableTh label="Diagnosis" sortKey="diagnosisType" activeSortKey={activeTable.sortKey} sortDir={activeTable.sortDir} onSort={activeTable.toggleSort} className="whitespace-nowrap" />
                    <SortableTh label="Risk" sortKey="riskLevel" activeSortKey={activeTable.sortKey} sortDir={activeTable.sortDir} onSort={activeTable.toggleSort} className="whitespace-nowrap" />
                    <SortableTh label="Score" sortKey="riskScore" activeSortKey={activeTable.sortKey} sortDir={activeTable.sortDir} onSort={activeTable.toggleSort} className="whitespace-nowrap" />
                    <SortableTh label="CHW" sortKey="chwName" activeSortKey={activeTable.sortKey} sortDir={activeTable.sortDir} onSort={activeTable.toggleSort} className="whitespace-nowrap" />
                    <SortableTh label="Village" sortKey="village" activeSortKey={activeTable.sortKey} sortDir={activeTable.sortDir} onSort={activeTable.toggleSort} className="whitespace-nowrap" />
                    <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-widest text-text-hint whitespace-nowrap">
                      Recommended Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-[13px] text-text-hint">
                        No patients found
                      </td>
                    </tr>
                  )}
                  {activeTable.paged.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => router.push(`/clinical/patients/${p.id}`)}
                      className="table-row-hover transition-colors cursor-pointer"
                      style={{ borderBottom: '1px solid #E8F4F8' }}
                    >
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${riskDot(p.riskLevel)}`} />
                          <span className="text-[13px] font-semibold text-text-primary whitespace-nowrap">
                            {p.fullName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 data-num text-[12px] text-text-hint">
                        {p.patientCode}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge size="sm">{p.diagnosisType?.replace('_', '+') ?? '—'}</Badge>
                      </td>
                      <td className="py-3 pr-4"><RiskBadge level={p.riskLevel} /></td>
                      <td className="py-3 pr-4 data-num text-[13px] font-semibold text-text-primary">
                        {p.riskScore?.toFixed(0) ?? '—'}
                      </td>
                      <td className="py-3 pr-4 text-[12px] text-text-secondary whitespace-nowrap">
                        {p.chwName ?? '—'}
                      </td>
                      <td className="py-3 pr-4 text-[12px] text-text-secondary">
                        {p.village ?? '—'}
                      </td>
                      <td className="py-3 text-[12px] text-text-secondary max-w-[160px] truncate">
                        {p.recommendedAction ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loading && (
            <Pagination
              className="-mx-6 -mb-6 mt-4"
              page={activeTable.page}
              totalPages={activeTable.totalPages}
              totalItems={activeTable.totalItems}
              pageSize={activeTable.pageSize}
              onPageChange={activeTable.setPage}
            />
          )}
        </Card>
      )}

      {/* ── Provisional patients ─────────────────────────────── */}
      {tab === 'provisional' && (
        <Card
          title="Awaiting Clinical Confirmation"
          subtitle="CHW-screened provisional patients — confirm to activate treatment"
        >
          {provisional.length === 0 && !loading && (
            <div className="py-10 text-center">
              <AlertCircle size={28} className="text-text-hint mx-auto mb-3" />
              <p className="text-[13px] text-text-secondary">No provisional patients awaiting confirmation.</p>
            </div>
          )}
          {loading ? <Spinner /> : (
            <>
              <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
                <div className="relative">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-hint pointer-events-none" />
                  <input
                    className="pl-8 pr-3 py-1.5 text-[12px] rounded-lg bg-white outline-none w-52"
                    style={{ border: '1px solid #DCECF0' }}
                    placeholder="Search name or referral ID…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = '#E8714A'; }}
                    onBlur={e  => { (e.currentTarget as HTMLInputElement).style.borderColor = '#DCECF0'; }}
                  />
                </div>
                <SortSelect
                  options={[
                    { key: 'fullName', label: 'Name' },
                    { key: 'referralId', label: 'Referral ID' },
                    { key: 'village', label: 'Village' },
                  ]}
                  sortKey={provTable.sortKey}
                  sortDir={provTable.sortDir}
                  onChange={provTable.toggleSort}
                />
              </div>
              <div className="space-y-2">
                {provTable.paged.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => router.push(`/clinical/patients/${p.id}`)}
                    className="flex items-center justify-between rounded-lg px-4 py-3 cursor-pointer transition-colors"
                    style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#FEF3C7'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = '#FFFBEB'; }}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white"
                          style={{ background: '#F39C12' }}
                        >
                          PROVISIONAL
                        </span>
                        <span className="text-[13px] font-semibold text-text-primary">{p.fullName}</span>
                      </div>
                      <p className="text-[12px] text-text-secondary">
                        {p.referralId && (
                          <span className="data-num mr-3">{p.referralId}</span>
                        )}
                        {p.suspectedCondition && <span>Suspected: {p.suspectedCondition}</span>}
                        {p.village && <span className="ml-3">· {p.village}</span>}
                      </p>
                    </div>
                    <span
                      className="text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-white shrink-0"
                      style={{ color: '#F39C12', border: '1px solid #FDE68A' }}
                    >
                      Confirm →
                    </span>
                  </div>
                ))}
              </div>
              <Pagination
                className="-mx-6 -mb-6 mt-4"
                page={provTable.page}
                totalPages={provTable.totalPages}
                totalItems={provTable.totalItems}
                pageSize={provTable.pageSize}
                onPageChange={provTable.setPage}
              />
            </>
          )}
        </Card>
      )}
    </DashboardLayout>
  );
}

function TabBtn({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center text-[12px] px-3 py-1.5 rounded font-semibold transition-colors"
      style={{
        background: active ? '#fff' : 'transparent',
        color: active ? '#1A1A2E' : '#5A6474',
        boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
      }}
    >
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
