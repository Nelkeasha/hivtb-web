'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import Badge, { RiskBadge } from '@/components/ui/Badge';
import FormField from '@/components/ui/FormField';
import FormSelect from '@/components/ui/FormSelect';
import { api, extractErrorMessage, extractFieldErrors } from '@/lib/api';
import {
  required as validateRequired, nationalId as validateNationalId,
  dateNotFuture as validateDateNotFuture, maxLength as validateMaxLength,
} from '@/lib/validation/rules';
import {
  ArrowLeft, Plus, X, CheckCircle, Clock,
  MapPin, Stethoscope, Calendar, Pill, AlertCircle, Phone, User,
  Home, Bell,
} from 'lucide-react';
import ApiErrorBanner from '@/components/ui/ApiErrorBanner';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Patient {
  id: string; fullName: string; patientCode: string; diagnosisType?: string;
  dateOfBirth?: string; sex?: string; phoneNumber?: string;
  village?: string; sector?: string; district?: string;
  chwName?: string; facilityName?: string;
  artStartDate?: string; tbTreatmentStartDate?: string;
  riskLevel?: string; riskScore?: number;
  registrationStatus?: string; registrationRoute?: string; referralId?: string;
  suspectedCondition?: string; screeningNotes?: string;
  // Structured RBC TB symptom screen
  tbSymptomCough?: boolean; tbSymptomFever?: boolean; tbSymptomNightSweats?: boolean;
  tbSymptomWeightLoss?: boolean; tbSymptomChestPain?: boolean; presumptiveTb?: boolean;
  // Community HIV testing-risk screen (null for supervisors/admins)
  hivRiskNeverTested?: boolean; hivRiskPartnerPositive?: boolean; hivRiskUnprotectedSex?: boolean;
  hivRiskStiTreatment?: boolean; hivRiskRecurrentIllness?: boolean;
  hivTestingReferral?: boolean; manualReferralReason?: string;
  unresolvedAlerts?: AlertItem[];
  recentHomeVisits?: HomeVisitItem[];
}

interface AlertItem {
  id: string; alertType: string; severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string; message: string; createdAt: string;
}

interface HomeVisitItem {
  id: string; chwName?: string; visitDate: string;
  visitStatus?: string; adherenceStatus?: string;
  pillCountRecorded?: number; pillCountExpected?: number;
  pillCountDiscrepancy?: boolean; symptomsReported?: string;
  sideEffectsReported?: string; psychosocialNotes?: string; nextVisitDate?: string;
  // Differentiated DOT model (V33)
  dotObserved?: boolean;
  tbSideEffects?: Record<string, boolean>;
  artSideEffects?: Record<string, boolean>;
  homeVentilationOk?: boolean;
  coughHygieneOk?: boolean;
  nextDotDate?: string;
  homeVisitTrigger?: string;
}

const _SE_LABELS: Record<string, string> = {
  jaundice: 'Jaundice', neuropathy: 'Neuropathy', vomiting: 'Vomiting',
  rash: 'Rash', jointPain: 'Joint pain', visionChanges: 'Vision changes',
};
function trueKeys(m?: Record<string, boolean>): string {
  if (!m) return '';
  return Object.entries(m).filter(([, v]) => v).map(([k]) => _SE_LABELS[k] ?? k).join(', ');
}

interface Schedule {
  id: string; planId: string; patientId: string;
  doseTime: string; doseLabel?: string;
  notificationMethod: string; windowDurationMinutes: number;
  isActive: boolean; createdByName?: string; prescriptionSource?: string;
  createdAt?: string;
}

interface Plan {
  id: string; patientId: string; medicationName: string;
  dosage: string; frequency: string; startDate: string;
  endDate?: string; isActive: boolean; createdByName?: string;
  schedules: Schedule[];
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const [patient, setPatient]   = useState<Patient | null>(null);
  const [plans, setPlans]       = useState<Plan[]>([]);
  const [loading, setLoading]   = useState(true);
  const [apiError, setApiError] = useState('');
  const [showAddPlan, setShowAddPlan]           = useState(false);
  const [addingScheduleTo, setAddingScheduleTo] = useState<string | null>(null);
  const [showAllVisits, setShowAllVisits]       = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/api/clinical/dashboard/patients/${id}`),
      api.get(`/api/treatment-plans/patient/${id}`),
    ]).then(([pr, plr]) => {
      setPatient(pr.data);
      setPlans(plr.data);
    }).catch(e => setApiError(extractErrorMessage(e, 'Failed to load patient data. Try refreshing.')))
      .finally(() => setLoading(false));
  }, [id]);

  function reload() {
    api.get(`/api/treatment-plans/patient/${id}`)
      .then((r) => setPlans(r.data))
      .catch(e => setApiError(extractErrorMessage(e, 'Failed to reload plans.')));
  }

  if (loading) {
    return (
      <DashboardLayout title="Patient">
        <div className="flex justify-center py-20">
          <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!patient) {
    return (
      <DashboardLayout title="Patient">
        <div className="text-center py-20">
          <p className="text-[13px] font-semibold" style={{ color: '#E64B2E' }}>
            {apiError || 'Patient not found.'}
          </p>
          {apiError && (
            <p className="text-[12px] text-text-hint mt-1">
              Try refreshing the page.
            </p>
          )}
        </div>
      </DashboardLayout>
    );
  }

  const activePlans   = plans.filter((p) => p.isActive);
  const inactivePlans = plans.filter((p) => !p.isActive);

  const initials = patient.fullName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <DashboardLayout title={patient.fullName}>

      {apiError && <ApiErrorBanner message={apiError} onDismiss={() => setApiError('')} className="mb-4" />}

      {/* ── Back + breadcrumb ──────────────────────────────── */}
      <button
        onClick={() => router.push('/clinical/patients')}
        className="flex items-center gap-1.5 text-[13px] text-text-secondary mb-6 transition-colors"
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#2C2C2C'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#6B7280'; }}
      >
        <ArrowLeft size={14} /> Back to Patients
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Left — patient card ──────────────────────────── */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E9E9E9' }}>

            {/* Teal header accent */}
            <div style={{ height: 3, background: '#E64B2E' }} />

            <div className="p-5">
              {/* Avatar + name */}
              <div className="flex items-start gap-3 mb-5">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-[14px]"
                  style={{ background: '#E64B2E' }}
                >
                  {initials}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <h2 className="text-[15px] font-bold text-text-primary leading-tight">
                    {patient.fullName}
                  </h2>
                  <p className="data-num text-[11px] text-text-hint mt-0.5">
                    {patient.patientCode}
                  </p>
                  {patient.riskLevel && (
                    <div className="mt-2"><RiskBadge level={patient.riskLevel} /></div>
                  )}
                </div>
              </div>

              {/* Demographics */}
              <div className="space-y-0" style={{ borderTop: '1px solid #F0F0F0' }}>
                <InfoRow icon={<Stethoscope size={12} />} label="Diagnosis"
                  value={patient.diagnosisType?.replace('_', ' + ') ?? '—'} />
                <InfoRow icon={<User size={12} />} label="Sex" value={patient.sex ?? '—'} />
                {patient.dateOfBirth && (
                  <InfoRow icon={<Calendar size={12} />} label="Born"
                    value={patient.dateOfBirth} mono />
                )}
                {patient.phoneNumber && (
                  <InfoRow icon={<Phone size={12} />} label="Phone"
                    value={patient.phoneNumber} mono />
                )}
                <InfoRow icon={<MapPin size={12} />} label="Location"
                  value={[patient.village, patient.district].filter(Boolean).join(', ') || '—'} />
                {patient.chwName && (
                  <InfoRow icon={<User size={12} />} label="CHW" value={patient.chwName} />
                )}
                {patient.facilityName && (
                  <InfoRow icon={<Stethoscope size={12} />} label="Facility"
                    value={patient.facilityName} />
                )}
              </div>

              {/* Treatment dates */}
              {(patient.artStartDate || patient.tbTreatmentStartDate) && (
                <div className="mt-4 pt-4 space-y-0" style={{ borderTop: '1px solid #F0F0F0' }}>
                  {patient.artStartDate && (
                    <InfoRow icon={<Calendar size={12} />} label="ART start"
                      value={patient.artStartDate} mono />
                  )}
                  {patient.tbTreatmentStartDate && (
                    <InfoRow icon={<Calendar size={12} />} label="TB start"
                      value={patient.tbTreatmentStartDate} mono />
                  )}
                </div>
              )}

              {/* Risk score chip */}
              {patient.riskScore != null && (
                <div
                  className="mt-4 pt-4 flex items-center justify-between"
                  style={{ borderTop: '1px solid #F0F0F0' }}
                >
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-text-hint">
                    AI Risk Score
                  </span>
                  <span
                    className="data-num text-[20px] font-semibold"
                    style={{
                      color: patient.riskScore >= 70 ? '#C0392B' :
                             patient.riskScore >= 40 ? '#F39C12' : '#27AE60',
                    }}
                  >
                    {patient.riskScore.toFixed(0)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right — confirm panel + treatment plans ──────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Confirm provisional */}
          {patient.registrationStatus === 'PROVISIONAL' && (
            <ConfirmProvisionalCard
              patient={patient}
              onConfirmed={() => window.location.reload()}
            />
          )}

          {/* Screening results stay visible after confirmation (the provisional
              card renders its own copy, so only show here once confirmed). */}
          {patient.registrationStatus !== 'PROVISIONAL' && (
            <ScreeningResults patient={patient} />
          )}

          {/* Active alerts — summary only; full management lives on /clinical/alerts */}
          {(patient.unresolvedAlerts?.length ?? 0) > 0 && (
            <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E9E9E9' }}>
              <div className="flex items-center justify-between gap-2 px-6 py-4" style={{ borderBottom: '1px solid #F0F0F0' }}>
                <div className="flex items-center gap-2">
                  <Bell size={14} style={{ color: '#C0392B' }} />
                  <h3 className="text-[13px] font-semibold text-text-primary tracking-tight">
                    Active Alerts
                  </h3>
                </div>
                <span
                  className="data-num text-[11px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: '#FEF2F2', color: '#C0392B', border: '1px solid #FECACA' }}
                >
                  {patient.unresolvedAlerts!.length}
                </span>
              </div>
              <div className="px-6 py-4 space-y-3">
                {patient.unresolvedAlerts!.slice(0, 2).map((a) => (
                  <div key={a.id} className="rounded-lg p-3" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-[13px] font-semibold text-text-primary">{a.title}</p>
                      <Badge variant={a.severity === 'CRITICAL' ? 'critical' : a.severity === 'WARNING' ? 'warning' : 'info'}>
                        {a.severity}
                      </Badge>
                    </div>
                    <p className="text-[12px] text-text-secondary line-clamp-2">{a.message}</p>
                    <p className="data-num text-[11px] text-text-hint mt-1.5">
                      {new Date(a.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
              <Link
                href="/clinical/alerts"
                className="block px-6 py-3 text-[12px] font-semibold text-center"
                style={{ borderTop: '1px solid #F0F0F0', color: '#E64B2E' }}
              >
                {patient.unresolvedAlerts!.length > 2
                  ? `View all ${patient.unresolvedAlerts!.length} in Alerts →`
                  : 'Manage in Alerts →'}
              </Link>
            </div>
          )}

          {/* Recent home visits */}
          {(patient.recentHomeVisits?.length ?? 0) > 0 && (
            <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E9E9E9' }}>
              <div className="flex items-center gap-2 px-6 py-4" style={{ borderBottom: '1px solid #F0F0F0' }}>
                <Home size={14} style={{ color: '#E64B2E' }} />
                <h3 className="text-[13px] font-semibold text-text-primary tracking-tight">
                  Recent Home Visits
                </h3>
              </div>
              <div className="px-6 py-4 space-y-3">
                {(showAllVisits ? patient.recentHomeVisits! : patient.recentHomeVisits!.slice(0, 2)).map((v) => (
                  <div key={v.id} className="rounded-lg p-3" style={{ background: '#FAFAFA', border: '1px solid #E9E9E9' }}>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <p className="data-num text-[12px] font-semibold text-text-primary">
                        {new Date(v.visitDate).toLocaleString()}
                      </p>
                      <div className="flex items-center gap-1.5">
                        {v.visitStatus && (
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded"
                            style={{ background: '#F0FDF4', color: '#27AE60', border: '1px solid #BBF7D0' }}
                          >
                            {v.visitStatus}
                          </span>
                        )}
                        {v.adherenceStatus && (
                          <Badge variant={v.adherenceStatus === 'GOOD' ? 'low' : v.adherenceStatus === 'POOR' ? 'critical' : 'moderate'}>
                            {v.adherenceStatus.replace(/_/g, ' ').toLowerCase()}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {v.chwName && (
                      <p className="text-[11px] text-text-hint mb-1">CHW: {v.chwName}</p>
                    )}
                    {v.homeVisitTrigger && (
                      <p className="text-[11px] mb-1 font-semibold" style={{ color: '#B45309' }}>
                        Triggered by: {v.homeVisitTrigger.replace(/_/g, ' ').toLowerCase()}
                      </p>
                    )}
                    {/* Card A — ART monitoring (HIV / co-infection) */}
                    {patient.diagnosisType?.includes('HIV') && (v.pillCountRecorded != null || v.pillCountExpected != null) && (
                      <p className="text-[12px] text-text-secondary">
                        Pill count: <span className="data-num">{v.pillCountRecorded ?? '—'}</span> recorded
                        {' / '}<span className="data-num">{v.pillCountExpected ?? '—'}</span> expected
                        {v.pillCountDiscrepancy && (
                          <span className="ml-1.5 font-semibold" style={{ color: '#C0392B' }}>(discrepancy)</span>
                        )}
                      </p>
                    )}
                    {patient.diagnosisType?.includes('HIV') && trueKeys(v.artSideEffects) && (
                      <p className="text-[12px] mt-1" style={{ color: '#B45309' }}>
                        ART side effects: {trueKeys(v.artSideEffects)}
                      </p>
                    )}
                    {/* Card B — Directly Observed Therapy (TB / co-infection).
                        Only render fields the CHW actually assessed — an untouched
                        toggle arrives as null and must not read as a definitive "No". */}
                    {patient.diagnosisType?.includes('TB') &&
                      (v.dotObserved != null || trueKeys(v.tbSideEffects) ||
                        v.homeVentilationOk != null || v.coughHygieneOk != null || v.nextDotDate) && (
                      <div className="mt-1.5 rounded-md p-2" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                        <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: '#991B1B' }}>DOT record</p>
                        {v.dotObserved != null && (
                          <p className="text-[12px]" style={{ color: '#7F1D1D' }}>
                            Observed swallow: <span className="font-semibold">{v.dotObserved ? 'Yes' : 'No'}</span>
                          </p>
                        )}
                        {trueKeys(v.tbSideEffects) && (
                          <p className="text-[12px]" style={{ color: '#7F1D1D' }}>TB side effects: {trueKeys(v.tbSideEffects)}</p>
                        )}
                        {v.homeVentilationOk != null && (
                          <p className="text-[12px]" style={{ color: '#7F1D1D' }}>
                            Home ventilation: <span className="font-semibold">{v.homeVentilationOk ? 'OK' : 'not adequate'}</span>
                          </p>
                        )}
                        {v.coughHygieneOk != null && (
                          <p className="text-[12px]" style={{ color: '#7F1D1D' }}>
                            Cough hygiene: <span className="font-semibold">{v.coughHygieneOk ? 'OK' : 'not practiced'}</span>
                          </p>
                        )}
                        {v.nextDotDate && (
                          <p className="data-num text-[11px] mt-0.5" style={{ color: '#991B1B' }}>
                            Next DOT: {new Date(v.nextDotDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                    {v.symptomsReported && (
                      <p className="text-[12px] text-text-secondary mt-1">Symptoms: {v.symptomsReported}</p>
                    )}
                    {v.sideEffectsReported && (
                      <p className="text-[12px] text-text-secondary mt-1">Side effects: {v.sideEffectsReported}</p>
                    )}
                    {v.psychosocialNotes && (
                      <p className="text-[12px] text-text-secondary mt-1">Notes: {v.psychosocialNotes}</p>
                    )}
                    {v.nextVisitDate && (
                      <p className="data-num text-[11px] text-text-hint mt-1.5">
                        Next visit: {new Date(v.nextVisitDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              {patient.recentHomeVisits!.length > 2 && (
                <button
                  onClick={() => setShowAllVisits((s) => !s)}
                  className="block w-full px-6 py-3 text-[12px] font-semibold text-center"
                  style={{ borderTop: '1px solid #F0F0F0', color: '#E64B2E' }}
                >
                  {showAllVisits
                    ? 'Show less'
                    : `Show all ${patient.recentHomeVisits!.length} visits →`}
                </button>
              )}
            </div>
          )}

          {/* Treatment plans card */}
          <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E9E9E9' }}>
            {/* Card header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid #F0F0F0' }}
            >
              <div>
                <h3 className="text-[13px] font-semibold text-text-primary tracking-tight">
                  Dose Schedule Management
                </h3>
                <p className="text-[11px] text-text-hint mt-0.5">
                  Treatment plans and dose schedules
                </p>
              </div>
              <Button size="sm" icon={Plus} onClick={() => setShowAddPlan(true)}>
                New Plan
              </Button>
            </div>

            <div className="px-6 pb-6 pt-5">
              {/* Add plan form */}
              {showAddPlan && (
                <AddPlanForm
                  patientId={id}
                  onDone={() => { setShowAddPlan(false); reload(); }}
                  onCancel={() => setShowAddPlan(false)}
                />
              )}

              {plans.length === 0 && !showAddPlan && (
                <div className="text-center py-10">
                  <Pill size={28} className="text-text-hint mx-auto mb-3" />
                  <p className="text-[13px] text-text-secondary">No treatment plans yet.</p>
                  <p className="text-[12px] text-text-hint mt-1">Click "New Plan" to create one.</p>
                </div>
              )}

              {/* Active plans */}
              {activePlans.map((plan) => (
                <PlanBlock
                  key={plan.id}
                  plan={plan}
                  addingScheduleTo={addingScheduleTo}
                  onAddSchedule={() => setAddingScheduleTo(plan.id)}
                  onScheduleAdded={() => { setAddingScheduleTo(null); reload(); }}
                  onCancelAddSchedule={() => setAddingScheduleTo(null)}
                  onDeactivate={() =>
                    api.put(`/api/treatment-plans/${plan.id}`, { isActive: false })
                      .then(reload)
                      .catch(e => setApiError(extractErrorMessage(e, 'Failed to deactivate plan.')))
                  }
                  onDeactivateSchedule={(sid) =>
                    api.put(`/api/treatment-plans/schedules/${sid}/deactivate`)
                      .then(reload)
                      .catch(e => setApiError(extractErrorMessage(e, 'Failed to deactivate schedule.')))
                  }
                />
              ))}

              {/* Inactive history */}
              {inactivePlans.length > 0 && (
                <details className="mt-5">
                  <summary
                    className="text-[12px] text-text-hint cursor-pointer select-none"
                    style={{ color: '#9CA3AF' }}
                  >
                    {inactivePlans.length} inactive plan{inactivePlans.length !== 1 ? 's' : ''} — history
                  </summary>
                  <div className="mt-3 space-y-3 opacity-50 pointer-events-none">
                    {inactivePlans.map((plan) => (
                      <PlanBlock
                        key={plan.id}
                        plan={plan}
                        readOnly
                        addingScheduleTo={null}
                        onAddSchedule={() => {}}
                        onScheduleAdded={() => {}}
                        onCancelAddSchedule={() => {}}
                        onDeactivate={() => {}}
                        onDeactivateSchedule={() => {}}
                      />
                    ))}
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ── Screening Results (structured TB & HIV screens) ───────────────────────────

function ScreeningResults({ patient }: { patient: Patient }) {
  const tb: [string, boolean | undefined][] = [
    ['Current cough', patient.tbSymptomCough],
    ['Fever (afternoon)', patient.tbSymptomFever],
    ['Night sweats', patient.tbSymptomNightSweats],
    ['Weight loss', patient.tbSymptomWeightLoss],
    ['Chest pain breathing', patient.tbSymptomChestPain],
  ];
  // Screening answers only exist for patients who came through CHW screening —
  // facility-registered patients were never screened, so show nothing for them.
  const screened = patient.registrationRoute === 'CHW_SCREENING';
  // Show only the block(s) actually completed for this patient's condition.
  const dt = patient.diagnosisType ?? patient.suspectedCondition ?? '';
  const showTb = screened && (dt === 'TB' || dt === 'HIV_TB_COINFECTION');
  // HIV risk answers are redacted (undefined) for supervisors/admins.
  const hivVisible = patient.hivRiskNeverTested !== undefined && patient.hivRiskNeverTested !== null;
  const showHiv = screened && (dt === 'HIV' || dt === 'HIV_TB_COINFECTION') && hivVisible;
  const hiv: [string, boolean | undefined][] = [
    ['Never tested for HIV', patient.hivRiskNeverTested],
    ['Partner HIV-positive', patient.hivRiskPartnerPositive],
    ['Unprotected sex, unknown status', patient.hivRiskUnprotectedSex],
    ['Recent STI treatment', patient.hivRiskStiTreatment],
    ['Recurrent illness', patient.hivRiskRecurrentIllness],
  ];

  const Answer = ({ label, yes }: { label: string; yes: boolean | undefined }) => (
    <div className="flex items-center justify-between text-[11.5px] py-0.5">
      <span style={{ color: '#78350F' }}>{label}</span>
      <span className="font-semibold" style={{ color: yes ? '#C0392B' : '#92400E' }}>
        {yes ? 'Yes' : 'No'}
      </span>
    </div>
  );

  const Badge = ({ text, bg, fg }: { text: string; bg: string; fg: string }) => (
    <span className="inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded"
      style={{ background: bg, color: fg }}>{text}</span>
  );

  if (!showTb && !showHiv) return null;

  return (
    <div className="mb-4 rounded-lg p-3" style={{ background: '#FEF3C7', border: '1px solid #FDE68A' }}>
      <div className="flex flex-wrap gap-2 mb-2">
        {showTb && patient.presumptiveTb && <Badge text="Presumptive TB" bg="#FDE2E0" fg="#C0392B" />}
        {showHiv && patient.hivTestingReferral && <Badge text="HIV Testing Referral" bg="#DBEAFE" fg="#1D4ED8" />}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        {showHiv && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: '#92400E' }}>HIV testing-risk screen</p>
            {hiv.map(([label, yes]) => <Answer key={label} label={label} yes={yes} />)}
            {patient.manualReferralReason && (
              <p className="text-[11px] mt-1 italic" style={{ color: '#92400E' }}>
                Manual referral: {patient.manualReferralReason}
              </p>
            )}
          </div>
        )}
        {showTb && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide mb-1 mt-2 sm:mt-0" style={{ color: '#92400E' }}>TB symptom screen</p>
            {tb.map(([label, yes]) => <Answer key={label} label={label} yes={yes} />)}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Confirm Provisional ───────────────────────────────────────────────────────

function ConfirmProvisionalCard({ patient, onConfirmed }: {
  patient: Patient; onConfirmed: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [done, setDone]       = useState(false);
  const [f, setF] = useState({
    diagnosisType: patient.suspectedCondition ?? 'TB',
    nationalPatientId: '',
    artStartDate: '',
    tbTreatmentStartDate: '',
    labResultNotes: '',
  });

  // Village-scoped CHW assignment (Change 1) — '' = keep the screening CHW.
  const [candMode, setCandMode] = useState<'SINGLE' | 'MULTIPLE' | 'NONE' | null>(null);
  const [candidates, setCandidates] = useState<{ id: string; fullName: string; assignedVillage?: string }[]>([]);
  const [assignedChwId, setAssignedChwId] = useState('');

  useEffect(() => {
    if (!patient.village) return;
    api.get('/api/clinical/dashboard/chw-candidates', { params: { village: patient.village } })
      .then(r => { setCandMode(r.data.mode); setCandidates(r.data.candidates ?? []); })
      .catch(() => { /* assignment widget stays hidden; screening CHW keeps the patient */ });
  }, [patient.village]);

  // Negative-result resolution (RBC 2022 registry block + prevention redirect)
  const [showNeg, setShowNeg] = useState(false);
  const [negLoading, setNegLoading] = useState(false);
  const [negDone, setNegDone] = useState(false);
  const [neg, setNeg] = useState({ labReference: '', notes: '' });

  async function resolveNegative() {
    if (!window.confirm(
      'Record this screening as NEGATIVE?\n\nThe voucher is dropped from the queue and blocked from ' +
      'the active patient tables. A prevention follow-up (TB differential / HIV PrEP) is sent to the CHW. ' +
      'This cannot be undone from here.'
    )) return;
    setNegLoading(true); setError('');
    try {
      await api.put(`/api/v1/patients/${patient.id}/resolve-negative`, {
        labReference: neg.labReference || undefined,
        notes: neg.notes || undefined,
      });
      setNegDone(true);
      setTimeout(onConfirmed, 1800);
    } catch (err: unknown) {
      setError(extractErrorMessage(err, 'Could not resolve as negative.'));
    } finally { setNegLoading(false); }
  }

  function validate(): Record<string, string> {
    const errors: Record<string, string> = {};
    const diagnosisError = validateRequired(f.diagnosisType, 'Confirmed diagnosis');
    if (diagnosisError) errors.diagnosisType = diagnosisError;
    const nationalIdError = validateNationalId(f.nationalPatientId);
    if (nationalIdError) errors.nationalPatientId = nationalIdError;
    const artError = validateDateNotFuture(f.artStartDate, 'ART start date');
    if (artError) errors.artStartDate = artError;
    const tbError = validateDateNotFuture(f.tbTreatmentStartDate, 'TB treatment start date');
    if (tbError) errors.tbTreatmentStartDate = tbError;
    return errors;
  }

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Please fix the highlighted fields below.');
      return;
    }
    setLoading(true); setError(''); setFieldErrors({});
    try {
      await api.put(`/api/v1/patients/${patient.id}/confirm`, {
        diagnosisType: f.diagnosisType,
        nationalPatientId: f.nationalPatientId || undefined,
        artStartDate: f.artStartDate || undefined,
        tbTreatmentStartDate: f.tbTreatmentStartDate || undefined,
        labResultNotes: f.labResultNotes || undefined,
        // '' = keep the screening CHW; otherwise a village-validated reassignment
        assignedChwId: assignedChwId || undefined,
      });
      setDone(true);
      setTimeout(onConfirmed, 1500);
    } catch (err: unknown) {
      setFieldErrors(extractFieldErrors(err));
      setError(extractErrorMessage(err, 'Confirmation failed'));
    } finally { setLoading(false); }
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #FDE68A' }}>
      {/* Amber accent strip */}
      <div style={{ height: 3, background: '#F39C12' }} />

      <div className="p-5" style={{ background: '#FFFBEB' }}>
        <div className="flex items-start gap-3 mb-4">
          <AlertCircle size={16} className="shrink-0 mt-0.5" style={{ color: '#F39C12' }} />
          <div>
            <p className="text-[13px] font-bold" style={{ color: '#78350F' }}>
              Provisional Patient — Awaiting Confirmation
            </p>
            {patient.referralId && (
              <p className="data-num text-[11px] mt-0.5" style={{ color: '#92400E' }}>
                Referral ID: {patient.referralId}
              </p>
            )}
            {patient.suspectedCondition && (
              <p className="text-[12px] mt-1" style={{ color: '#92400E' }}>
                CHW suspected: <strong>{patient.suspectedCondition}</strong>
                {patient.screeningNotes && ` — ${patient.screeningNotes}`}
              </p>
            )}
          </div>
        </div>

        <ScreeningResults patient={patient} />

        {negDone ? (
          <div className="text-[13px] font-semibold" style={{ color: '#B45309' }}>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} /> Screen resolved NEGATIVE — voucher dropped from the queue.
            </div>
            <p className="text-[12px] font-normal mt-1" style={{ color: '#92400E' }}>
              Blocked from active patient tables. Prevention follow-up sent to the CHW.
            </p>
          </div>
        ) : done ? (
          <div className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: '#27AE60' }}>
            <CheckCircle size={16} /> Patient confirmed and activated. Notifying CHW…
          </div>
        ) : (
          <form onSubmit={confirm} className="space-y-3">
            {error && (
              <p className="text-[12px] font-medium" style={{ color: '#C0392B' }}>{error}</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormSelect
                label="Confirmed Diagnosis"
                value={f.diagnosisType}
                onChange={(v) => setF({ ...f, diagnosisType: v })}
                required
                error={fieldErrors.diagnosisType}
              >
                <option value="HIV">HIV</option>
                <option value="TB">TB</option>
                <option value="HIV_TB_COINFECTION">HIV + TB Co-infection</option>
              </FormSelect>
              <FormField
                label="National Patient ID"
                value={f.nationalPatientId}
                onChange={(v) => setF({ ...f, nationalPatientId: v })}
                placeholder="1198580000000012"
                required={false}
                hint="16 digits"
                error={fieldErrors.nationalPatientId}
              />
              {(f.diagnosisType === 'HIV' || f.diagnosisType === 'HIV_TB_COINFECTION') && (
                <FormField
                  label="ART Start Date"
                  value={f.artStartDate}
                  onChange={(v) => setF({ ...f, artStartDate: v })}
                  type="date"
                  required={false}
                  error={fieldErrors.artStartDate}
                />
              )}
              {(f.diagnosisType === 'TB' || f.diagnosisType === 'HIV_TB_COINFECTION') && (
                <FormField
                  label="TB Treatment Start Date"
                  value={f.tbTreatmentStartDate}
                  onChange={(v) => setF({ ...f, tbTreatmentStartDate: v })}
                  type="date"
                  required={false}
                  error={fieldErrors.tbTreatmentStartDate}
                />
              )}
            </div>
            <FormField
              label="Lab result notes (GeneXpert, etc.)"
              value={f.labResultNotes}
              onChange={(v) => setF({ ...f, labResultNotes: v })}
              placeholder="GeneXpert: Mycobacterium tuberculosis detected. Rifampicin resistance not detected."
              required={false}
            />

            {/* Village-scoped CHW assignment — defaults to the screening CHW */}
            {candMode && (
              <div className="pt-1">
                {candMode === 'NONE' && (
                  <p className="text-[12px] mb-1.5 font-medium" style={{ color: '#B45309' }}>
                    No CHW covers “{patient.village}” — the screening CHW keeps this patient
                    unless you pick a facility CHW below.
                  </p>
                )}
                <FormSelect
                  label={`Assign to CHW${patient.chwName ? ` (current: ${patient.chwName})` : ''}`}
                  value={assignedChwId}
                  onChange={setAssignedChwId}
                  required={false}
                  hint={candMode === 'MULTIPLE'
                    ? `${candidates.length} CHWs cover ${patient.village ?? 'this village'} — reassign or keep the screening CHW.`
                    : candMode === 'SINGLE'
                      ? `${candidates[0]?.fullName ?? 'One CHW'} covers ${patient.village ?? 'this village'}.`
                      : 'Facility-wide list (no village CHW).'}
                >
                  <option value="">Keep current CHW{patient.chwName ? ` — ${patient.chwName}` : ''}</option>
                  {candidates.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.fullName}{c.assignedVillage ? ` (${c.assignedVillage})` : ''}
                    </option>
                  ))}
                </FormSelect>
              </div>
            )}
            <Button type="submit" icon={CheckCircle} loading={loading}
              className="bg-amber-600 hover:bg-amber-700 text-white">
              Confirm &amp; Activate Patient
            </Button>

            {/* Negative-result path — RBC 2022 registry block + prevention redirect */}
            <div className="pt-3 mt-1" style={{ borderTop: '1px solid #FDE68A' }}>
              {!showNeg ? (
                <button
                  type="button"
                  onClick={() => setShowNeg(true)}
                  className="text-[12px] font-semibold"
                  style={{ color: '#B91C1C' }}
                >
                  Lab result came back negative? Record negative &amp; drop from queue →
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-[12px]" style={{ color: '#78350F' }}>
                    Record a <strong>NEGATIVE</strong> lab result{patient.referralId ? ` for voucher ${patient.referralId}` : ''}.
                    The screening is dropped from the queue, blocked from active patient tables, and
                    redirected to prevention (TB differential / HIV PrEP) for the CHW.
                  </p>
                  <FormField
                    label="Lab reference (optional)"
                    value={neg.labReference}
                    onChange={(v) => setNeg({ ...neg, labReference: v })}
                    placeholder="GeneXpert: MTB not detected / HIV rapid test: non-reactive"
                    required={false}
                  />
                  <FormField
                    label="Notes (optional)"
                    value={neg.notes}
                    onChange={(v) => setNeg({ ...neg, notes: v })}
                    required={false}
                  />
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      onClick={resolveNegative}
                      loading={negLoading}
                      className="bg-red-700 hover:bg-red-800 text-white"
                    >
                      Confirm Negative &amp; Drop from Queue
                    </Button>
                    <button
                      type="button"
                      onClick={() => setShowNeg(false)}
                      className="text-[12px]"
                      style={{ color: '#92400E' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Plan block ────────────────────────────────────────────────────────────────

function PlanBlock({
  plan, readOnly = false, addingScheduleTo,
  onAddSchedule, onScheduleAdded, onCancelAddSchedule,
  onDeactivate, onDeactivateSchedule,
}: {
  plan: Plan; readOnly?: boolean; addingScheduleTo: string | null;
  onAddSchedule: () => void; onScheduleAdded: () => void;
  onCancelAddSchedule: () => void; onDeactivate: () => void;
  onDeactivateSchedule: (id: string) => void;
}) {
  const activeSchedules   = plan.schedules.filter((s) => s.isActive);
  const inactiveSchedules = plan.schedules.filter((s) => !s.isActive);

  return (
    <div
      className="rounded-xl mt-4 overflow-hidden"
      style={{
        border: '1px solid #E9E9E9',
        background: plan.isActive ? '#fff' : '#FAFAFA',
      }}
    >
      {/* Plan header */}
      <div className="flex items-start justify-between gap-3 px-4 py-4"
           style={{ borderBottom: '1px solid #F0F0F0' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'rgba(231,74,46,0.09)' }}
          >
            <Pill size={15} style={{ color: '#E64B2E' }} />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-text-primary leading-tight">
              {plan.medicationName}
            </p>
            <p className="text-[12px] text-text-secondary mt-0.5">
              {plan.dosage} · {plan.frequency.replace(/_/g, ' ').toLowerCase()}
            </p>
            <p className="data-num text-[11px] text-text-hint mt-0.5">
              Started {plan.startDate}
              {plan.createdByName && ` · by ${plan.createdByName}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {plan.isActive && (
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded"
              style={{ background: '#F0FDF4', color: '#27AE60', border: '1px solid #BBF7D0' }}
            >
              Active
            </span>
          )}
          {!readOnly && plan.isActive && (
            <button
              onClick={onDeactivate}
              className="text-[11px] font-semibold px-2 py-0.5 rounded transition-colors"
              style={{ color: '#C0392B', border: '1px solid #FECACA', background: 'transparent' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FEF2F2'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              Deactivate
            </button>
          )}
        </div>
      </div>

      {/* Schedules */}
      <div className="px-4 pb-4">
        {activeSchedules.length > 0 && (
          <div className="mt-3 space-y-2">
            {activeSchedules.map((s) => (
              <ScheduleRow
                key={s.id} schedule={s} readOnly={readOnly}
                onDeactivate={() => onDeactivateSchedule(s.id)}
              />
            ))}
          </div>
        )}

        {inactiveSchedules.length > 0 && (
          <div className="mt-2 space-y-1.5 opacity-40">
            {inactiveSchedules.map((s) => (
              <ScheduleRow key={s.id} schedule={s} readOnly />
            ))}
          </div>
        )}

        {/* Add schedule form / button */}
        {!readOnly && plan.isActive && addingScheduleTo === plan.id && (
          <div className="mt-3">
            <AddScheduleForm
              planId={plan.id}
              onDone={onScheduleAdded}
              onCancel={onCancelAddSchedule}
            />
          </div>
        )}

        {!readOnly && plan.isActive && addingScheduleTo !== plan.id && (
          <button
            onClick={onAddSchedule}
            className="mt-3 flex items-center gap-1.5 text-[12px] font-semibold transition-colors"
            style={{ color: '#E64B2E' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#C73E22'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#E64B2E'; }}
          >
            <Plus size={13} /> Add Dose Schedule
          </button>
        )}
      </div>
    </div>
  );
}

// ── Schedule row ──────────────────────────────────────────────────────────────

function ScheduleRow({
  schedule, readOnly = false, onDeactivate,
}: {
  schedule: Schedule; readOnly?: boolean; onDeactivate?: () => void;
}) {
  const time = schedule.doseTime.length >= 5
    ? schedule.doseTime.substring(0, 5)
    : schedule.doseTime;

  return (
    <div
      className="flex items-center gap-3 rounded-lg px-3 py-2.5"
      style={{ background: '#FAFAFA', border: '1px solid #E9E9E9' }}
    >
      <Clock size={12} className="shrink-0" style={{ color: schedule.isActive ? '#E64B2E' : '#9CA3AF' }} />
      <p
        className="data-num text-[14px] font-semibold shrink-0"
        style={{ color: schedule.isActive ? '#E64B2E' : '#9CA3AF', minWidth: 40 }}
      >
        {time}
      </p>
      <div className="flex-1 min-w-0">
        {schedule.doseLabel && (
          <p className="text-[12px] font-medium text-text-primary">{schedule.doseLabel}</p>
        )}
        {schedule.prescriptionSource && (
          <p className="text-[11px] text-text-hint italic truncate">{schedule.prescriptionSource}</p>
        )}
        {schedule.createdByName && (
          <p className="text-[11px] text-text-hint">by {schedule.createdByName}</p>
        )}
      </div>
      <span
        className="text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0"
        style={
          schedule.isActive
            ? { background: '#F0FDF4', color: '#27AE60', border: '1px solid #BBF7D0' }
            : { background: '#FAFAFA', color: '#9CA3AF', border: '1px solid #E9E9E9' }
        }
      >
        {schedule.notificationMethod}
      </span>
      {!readOnly && schedule.isActive && onDeactivate && (
        <button
          onClick={onDeactivate}
          className="text-text-hint transition-colors shrink-0"
          title="Deactivate schedule"
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#C0392B'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#9CA3AF'; }}
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}

// ── Forms ─────────────────────────────────────────────────────────────────────

function AddPlanForm({ patientId, onDone, onCancel }: {
  patientId: string; onDone: () => void; onCancel: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [medications, setMedications] = useState<{ id: string; name: string }[]>([]);
  const [f, setF] = useState({
    medicationId: '', dosage: '', frequency: 'ONCE_DAILY', startDate: '',
  });

  useEffect(() => {
    api.get('/api/treatment-plans/medications-formulary')
      .then((r) => setMedications(r.data))
      .catch(e => setError(extractErrorMessage(e, 'Could not load medications list.')));
  }, []);

  function validate(): Record<string, string> {
    const errors: Record<string, string> = {};
    const nameError = validateRequired(f.medicationId, 'Medication');
    if (nameError) errors.medicationId = nameError;
    const dosageError = validateRequired(f.dosage, 'Dosage') ?? validateMaxLength(f.dosage, 50, 'Dosage');
    if (dosageError) errors.dosage = dosageError;
    const startDateError = validateRequired(f.startDate, 'Start date');
    if (startDateError) errors.startDate = startDateError;
    return errors;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Please fix the highlighted fields below.');
      return;
    }
    setLoading(true); setError(''); setFieldErrors({});
    try {
      await api.post('/api/treatment-plans', { ...f, patientId });
      onDone();
    } catch (err: unknown) {
      setFieldErrors(extractFieldErrors(err));
      setError(extractErrorMessage(err, 'Failed to create plan'));
    } finally { setLoading(false); }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl p-4 mb-4 space-y-3"
      style={{ background: '#FAFAFA', border: '1px solid #E9E9E9' }}
    >
      <p className="text-[12px] font-semibold uppercase tracking-widest text-text-hint">
        New Treatment Plan
      </p>
      {error && <p className="text-[12px] font-medium" style={{ color: '#C0392B' }}>{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormSelect
          label="Medication"
          value={f.medicationId}
          onChange={(v) => setF({ ...f, medicationId: v })}
          error={fieldErrors.medicationId}
          required
        >
          <option value="">Select medication…</option>
          {medications.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </FormSelect>
        <FormField label="Dosage" value={f.dosage}
          onChange={(v) => setF({ ...f, dosage: v })}
          placeholder="1 tablet (300mg/300mg/600mg)" error={fieldErrors.dosage} />
        <FormSelect
          label="Frequency"
          value={f.frequency}
          onChange={(v) => setF({ ...f, frequency: v })}
          required
        >
          {['ONCE_DAILY', 'TWICE_DAILY', 'THREE_TIMES_DAILY', 'WEEKLY'].map((fr) => (
            <option key={fr} value={fr}>
              {fr.replace(/_/g, ' ').toLowerCase()}
            </option>
          ))}
        </FormSelect>
        <FormField label="Start Date" value={f.startDate}
          onChange={(v) => setF({ ...f, startDate: v })} type="date"
          error={fieldErrors.startDate} />
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" icon={CheckCircle} loading={loading}>Create Plan</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

function AddScheduleForm({ planId, onDone, onCancel }: {
  planId: string; onDone: () => void; onCancel: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [f, setF] = useState({
    doseTime: '08:00:00', doseLabel: '', notificationMethod: 'APP',
    prescriptionSource: '',
  });

  function validate(): Record<string, string> {
    const errors: Record<string, string> = {};
    const doseTimeError = validateRequired(f.doseTime, 'Dose time');
    if (doseTimeError) errors.doseTime = doseTimeError;
    const labelError = validateMaxLength(f.doseLabel, 50, 'Dose label');
    if (labelError) errors.doseLabel = labelError;
    const sourceError = validateMaxLength(f.prescriptionSource, 100, 'Prescription note');
    if (sourceError) errors.prescriptionSource = sourceError;
    return errors;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Please fix the highlighted fields below.');
      return;
    }
    setLoading(true); setError(''); setFieldErrors({});
    try {
      await api.post(`/api/treatment-plans/${planId}/schedules`, {
        ...f,
        prescriptionSource: f.prescriptionSource || undefined,
        doseLabel: f.doseLabel || undefined,
      });
      onDone();
    } catch (err: unknown) {
      setFieldErrors(extractFieldErrors(err));
      setError(extractErrorMessage(err, 'Failed to add schedule'));
    } finally { setLoading(false); }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl p-4 space-y-3"
      style={{ background: '#FAFAFA', border: '1px solid #E9E9E9' }}
    >
      <p className="text-[12px] font-semibold uppercase tracking-widest text-text-hint">
        Add Dose Schedule
      </p>
      {error && <p className="text-[12px] font-medium" style={{ color: '#C0392B' }}>{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField
          label="Dose Time"
          type="time"
          value={f.doseTime.substring(0, 5)}
          onChange={(v) => setF({ ...f, doseTime: v + ':00' })}
          error={fieldErrors.doseTime}
        />
        <FormField label="Dose Label" value={f.doseLabel}
          onChange={(v) => setF({ ...f, doseLabel: v })}
          placeholder="Morning Dose" required={false} error={fieldErrors.doseLabel} />
        <FormSelect
          label="Notification Method"
          value={f.notificationMethod}
          onChange={(v) => setF({ ...f, notificationMethod: v })}
        >
          <option value="APP">App</option>
          <option value="SMS">SMS</option>
        </FormSelect>
      </div>
      <p className="text-[12px] text-text-hint">
        Patients get a 45-minute confirmation window after each scheduled dose time.
      </p>
      <FormField
        label="Prescription note (clinic card reference)"
        value={f.prescriptionSource}
        onChange={(v) => setF({ ...f, prescriptionSource: v })}
        placeholder="Based on clinic card dated 2026-06-03. Schedule adjusted following CHW side effect report."
        required={false}
        error={fieldErrors.prescriptionSource}
      />
      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" icon={CheckCircle} loading={loading}>Add Schedule</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

// ── InfoRow ───────────────────────────────────────────────────────────────────

function InfoRow({
  icon, label, value, mono = false,
}: {
  icon: React.ReactNode; label: string; value: string; mono?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-2.5 py-2.5"
      style={{ borderBottom: '1px solid #F0F0F0' }}
    >
      <span className="shrink-0" style={{ color: '#9CA3AF' }}>{icon}</span>
      <span className="text-[11px] text-text-hint w-16 shrink-0">{label}</span>
      <span
        className={`text-[13px] font-medium text-text-primary truncate ${mono ? 'data-num' : ''}`}
      >
        {value}
      </span>
    </div>
  );
}
