'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import Badge, { RiskBadge } from '@/components/ui/Badge';
import { api, extractErrorMessage } from '@/lib/api';
import {
  ArrowLeft, Plus, X, CheckCircle, Clock,
  MapPin, Stethoscope, Calendar, Pill, AlertCircle, Phone, User,
  Home, Bell,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Patient {
  id: string; fullName: string; patientCode: string; diagnosisType?: string;
  dateOfBirth?: string; sex?: string; phoneNumber?: string;
  village?: string; sector?: string; district?: string;
  chwName?: string; facilityName?: string;
  artStartDate?: string; tbTreatmentStartDate?: string;
  riskLevel?: string; riskScore?: number;
  registrationStatus?: string; referralId?: string;
  suspectedCondition?: string; screeningNotes?: string;
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
  const [showAddPlan, setShowAddPlan]           = useState(false);
  const [addingScheduleTo, setAddingScheduleTo] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get(`/api/clinical/dashboard/patients/${id}`),
      api.get(`/api/treatment-plans/patient/${id}`),
    ]).then(([pr, plr]) => {
      setPatient(pr.data);
      setPlans(plr.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  function reload() {
    api.get(`/api/treatment-plans/patient/${id}`)
      .then((r) => setPlans(r.data))
      .catch(console.error);
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
        <p className="text-[13px] text-text-secondary">Patient not found.</p>
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

      {/* ── Back + breadcrumb ──────────────────────────────── */}
      <button
        onClick={() => router.push('/clinical/patients')}
        className="flex items-center gap-1.5 text-[13px] text-text-secondary mb-6 transition-colors"
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#1A1A2E'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#5A6474'; }}
      >
        <ArrowLeft size={14} /> Back to Patients
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Left — patient card ──────────────────────────── */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #DCECF0' }}>

            {/* Teal header accent */}
            <div style={{ height: 3, background: '#006D77' }} />

            <div className="p-5">
              {/* Avatar + name */}
              <div className="flex items-start gap-3 mb-5">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-[14px]"
                  style={{ background: '#006D77' }}
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
              <div className="space-y-0" style={{ borderTop: '1px solid #E8F4F8' }}>
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
                <div className="mt-4 pt-4 space-y-0" style={{ borderTop: '1px solid #E8F4F8' }}>
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
                  style={{ borderTop: '1px solid #E8F4F8' }}
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

          {/* Active alerts */}
          {(patient.unresolvedAlerts?.length ?? 0) > 0 && (
            <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #DCECF0' }}>
              <div className="flex items-center gap-2 px-6 py-4" style={{ borderBottom: '1px solid #E8F4F8' }}>
                <Bell size={14} style={{ color: '#C0392B' }} />
                <h3 className="text-[13px] font-semibold text-text-primary tracking-tight">
                  Active Alerts
                </h3>
              </div>
              <div className="px-6 py-4 space-y-3">
                {patient.unresolvedAlerts!.map((a) => (
                  <div key={a.id} className="rounded-lg p-3" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-[13px] font-semibold text-text-primary">{a.title}</p>
                      <Badge variant={a.severity === 'CRITICAL' ? 'critical' : a.severity === 'WARNING' ? 'warning' : 'info'}>
                        {a.severity}
                      </Badge>
                    </div>
                    <p className="text-[12px] text-text-secondary">{a.message}</p>
                    <p className="data-num text-[11px] text-text-hint mt-1.5">
                      {new Date(a.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent home visits */}
          {(patient.recentHomeVisits?.length ?? 0) > 0 && (
            <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #DCECF0' }}>
              <div className="flex items-center gap-2 px-6 py-4" style={{ borderBottom: '1px solid #E8F4F8' }}>
                <Home size={14} style={{ color: '#006D77' }} />
                <h3 className="text-[13px] font-semibold text-text-primary tracking-tight">
                  Recent Home Visits
                </h3>
              </div>
              <div className="px-6 py-4 space-y-3">
                {patient.recentHomeVisits!.map((v) => (
                  <div key={v.id} className="rounded-lg p-3" style={{ background: '#EDF6F9', border: '1px solid #DCECF0' }}>
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
                    {(v.pillCountRecorded != null || v.pillCountExpected != null) && (
                      <p className="text-[12px] text-text-secondary">
                        Pill count: <span className="data-num">{v.pillCountRecorded ?? '—'}</span> recorded
                        {' / '}<span className="data-num">{v.pillCountExpected ?? '—'}</span> expected
                        {v.pillCountDiscrepancy && (
                          <span className="ml-1.5 font-semibold" style={{ color: '#C0392B' }}>(discrepancy)</span>
                        )}
                      </p>
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
            </div>
          )}

          {/* Treatment plans card */}
          <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #DCECF0' }}>
            {/* Card header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid #E8F4F8' }}
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
                      .catch(console.error)
                  }
                  onDeactivateSchedule={(sid) =>
                    api.put(`/api/treatment-plans/schedules/${sid}/deactivate`)
                      .then(reload)
                      .catch(console.error)
                  }
                />
              ))}

              {/* Inactive history */}
              {inactivePlans.length > 0 && (
                <details className="mt-5">
                  <summary
                    className="text-[12px] text-text-hint cursor-pointer select-none"
                    style={{ color: '#AAB4BC' }}
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

// ── Confirm Provisional ───────────────────────────────────────────────────────

function ConfirmProvisionalCard({ patient, onConfirmed }: {
  patient: Patient; onConfirmed: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [done, setDone]       = useState(false);
  const [f, setF] = useState({
    diagnosisType: patient.suspectedCondition ?? 'TB',
    nationalPatientId: '',
    artStartDate: '',
    tbTreatmentStartDate: '',
    labResultNotes: '',
  });

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.put(`/api/clinical/patients/${patient.id}/confirm`, {
        diagnosisType: f.diagnosisType,
        nationalPatientId: f.nationalPatientId || undefined,
        artStartDate: f.artStartDate || undefined,
        tbTreatmentStartDate: f.tbTreatmentStartDate || undefined,
        labResultNotes: f.labResultNotes || undefined,
      });
      setDone(true);
      setTimeout(onConfirmed, 1500);
    } catch (err: unknown) {
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

        {done ? (
          <div className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: '#27AE60' }}>
            <CheckCircle size={16} /> Patient confirmed and activated. Notifying CHW…
          </div>
        ) : (
          <form onSubmit={confirm} className="space-y-3">
            {error && (
              <p className="text-[12px] font-medium" style={{ color: '#C0392B' }}>{error}</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5"
                       style={{ color: '#92400E' }}>
                  Confirmed Diagnosis *
                </label>
                <FormSelect
                  value={f.diagnosisType}
                  onChange={(v) => setF({ ...f, diagnosisType: v })}
                  required
                >
                  <option value="HIV">HIV</option>
                  <option value="TB">TB</option>
                  <option value="HIV_TB_COINFECTION">HIV + TB Co-infection</option>
                </FormSelect>
              </div>
              <FormField
                label="National Patient ID"
                value={f.nationalPatientId}
                onChange={(v) => setF({ ...f, nationalPatientId: v })}
                placeholder="1198580000000012"
                required={false}
              />
              {(f.diagnosisType === 'HIV' || f.diagnosisType === 'HIV_TB_COINFECTION') && (
                <FormField
                  label="ART Start Date"
                  value={f.artStartDate}
                  onChange={(v) => setF({ ...f, artStartDate: v })}
                  type="date"
                  required={false}
                />
              )}
              {(f.diagnosisType === 'TB' || f.diagnosisType === 'HIV_TB_COINFECTION') && (
                <FormField
                  label="TB Treatment Start Date"
                  value={f.tbTreatmentStartDate}
                  onChange={(v) => setF({ ...f, tbTreatmentStartDate: v })}
                  type="date"
                  required={false}
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
            <Button type="submit" icon={CheckCircle} loading={loading}
              className="bg-amber-600 hover:bg-amber-700 text-white">
              Confirm &amp; Activate Patient
            </Button>
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
        border: '1px solid #DCECF0',
        background: plan.isActive ? '#fff' : '#EDF6F9',
      }}
    >
      {/* Plan header */}
      <div className="flex items-start justify-between gap-3 px-4 py-4"
           style={{ borderBottom: '1px solid #E8F4F8' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'rgba(0,95,107,0.09)' }}
          >
            <Pill size={15} style={{ color: '#006D77' }} />
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
            style={{ color: '#006D77' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#004E57'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#006D77'; }}
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
      style={{ background: '#EDF6F9', border: '1px solid #DCECF0' }}
    >
      <Clock size={12} className="shrink-0" style={{ color: schedule.isActive ? '#006D77' : '#AAB4BC' }} />
      <p
        className="data-num text-[14px] font-semibold shrink-0"
        style={{ color: schedule.isActive ? '#006D77' : '#AAB4BC', minWidth: 40 }}
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
            : { background: '#EDF6F9', color: '#AAB4BC', border: '1px solid #DCECF0' }
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
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#AAB4BC'; }}
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
  const [f, setF] = useState({
    medicationName: '', dosage: '', frequency: 'ONCE_DAILY', startDate: '',
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/api/treatment-plans', { ...f, patientId });
      onDone();
    } catch (err: unknown) {
            setError(extractErrorMessage(err, 'Failed to create plan'));
    } finally { setLoading(false); }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl p-4 mb-4 space-y-3"
      style={{ background: '#EDF6F9', border: '1px solid #DCECF0' }}
    >
      <p className="text-[12px] font-semibold uppercase tracking-widest text-text-hint">
        New Treatment Plan
      </p>
      {error && <p className="text-[12px] font-medium" style={{ color: '#C0392B' }}>{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Medication name *" value={f.medicationName}
          onChange={(v) => setF({ ...f, medicationName: v })} placeholder="TDF/3TC/EFV" />
        <FormField label="Dosage *" value={f.dosage}
          onChange={(v) => setF({ ...f, dosage: v })}
          placeholder="1 tablet (300mg/300mg/600mg)" />
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-widest text-text-hint mb-1.5">
            Frequency *
          </label>
          <FormSelect
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
        </div>
        <FormField label="Start date *" value={f.startDate}
          onChange={(v) => setF({ ...f, startDate: v })} type="date" />
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
  const [f, setF] = useState({
    doseTime: '08:00:00', doseLabel: '', notificationMethod: 'APP',
    windowDurationMinutes: 45, prescriptionSource: '',
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post(`/api/treatment-plans/${planId}/schedules`, {
        ...f,
        prescriptionSource: f.prescriptionSource || undefined,
        doseLabel: f.doseLabel || undefined,
      });
      onDone();
    } catch (err: unknown) {
            setError(extractErrorMessage(err, 'Failed to add schedule'));
    } finally { setLoading(false); }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl p-4 space-y-3"
      style={{ background: '#EDF6F9', border: '1px solid #DCECF0' }}
    >
      <p className="text-[12px] font-semibold uppercase tracking-widest text-text-hint">
        Add Dose Schedule
      </p>
      {error && <p className="text-[12px] font-medium" style={{ color: '#C0392B' }}>{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-widest text-text-hint mb-1.5">
            Dose time *
          </label>
          <FormInput
            type="time"
            value={f.doseTime.substring(0, 5)}
            onChange={(e) => setF({ ...f, doseTime: e.target.value + ':00' })}
            required
          />
        </div>
        <FormField label="Dose label" value={f.doseLabel}
          onChange={(v) => setF({ ...f, doseLabel: v })}
          placeholder="Morning Dose" required={false} />
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-widest text-text-hint mb-1.5">
            Notification method
          </label>
          <FormSelect
            value={f.notificationMethod}
            onChange={(v) => setF({ ...f, notificationMethod: v })}
          >
            <option value="APP">App</option>
            <option value="SMS">SMS</option>
          </FormSelect>
        </div>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-widest text-text-hint mb-1.5">
            Window (minutes)
          </label>
          <FormInput
            type="number"
            min={15} max={120}
            value={String(f.windowDurationMinutes)}
            onChange={(e) => setF({ ...f, windowDurationMinutes: parseInt(e.target.value) || 45 })}
          />
        </div>
      </div>
      <FormField
        label="Prescription note (clinic card reference)"
        value={f.prescriptionSource}
        onChange={(v) => setF({ ...f, prescriptionSource: v })}
        placeholder="Based on clinic card dated 2026-06-03. Schedule adjusted following CHW side effect report."
        required={false}
      />
      <div className="flex gap-2 pt-1">
        <Button type="submit" size="sm" icon={CheckCircle} loading={loading}>Add Schedule</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

// ── Shared input primitives ───────────────────────────────────────────────────

function FormField({
  label, value, onChange, type = 'text', placeholder = '', required = true,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-widest text-text-hint mb-1.5">
        {label}
      </label>
      <FormInput
        type={type} value={value} required={required} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function FormInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      className="w-full px-3 py-2.5 text-[13px] rounded-lg bg-white outline-none placeholder:text-text-hint"
      style={{
        border: focused ? '1px solid #006D77' : '1px solid #DCECF0',
        boxShadow: focused ? '0 0 0 3px rgba(0,95,107,0.08)' : 'none',
      }}
      onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
      onBlur={(e)  => { setFocused(false); props.onBlur?.(e); }}
    />
  );
}

function FormSelect({
  value, onChange, required, children,
}: {
  value: string; onChange: (v: string) => void;
  required?: boolean; children: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      value={value}
      required={required}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2.5 text-[13px] rounded-lg bg-white outline-none"
      style={{
        border: focused ? '1px solid #006D77' : '1px solid #DCECF0',
        boxShadow: focused ? '0 0 0 3px rgba(0,95,107,0.08)' : 'none',
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      {children}
    </select>
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
      style={{ borderBottom: '1px solid #E8F4F8' }}
    >
      <span className="shrink-0" style={{ color: '#AAB4BC' }}>{icon}</span>
      <span className="text-[11px] text-text-hint w-16 shrink-0">{label}</span>
      <span
        className={`text-[13px] font-medium text-text-primary truncate ${mono ? 'data-num' : ''}`}
      >
        {value}
      </span>
    </div>
  );
}
