'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import FormField from '@/components/ui/FormField';
import FormSelect from '@/components/ui/FormSelect';
import { api, extractErrorMessage, extractFieldErrors } from '@/lib/api';
import {
  required as validateRequired, phone as validatePhone, nationalId as validateNationalId,
  maxLength as validateMaxLength, dateNotFuture as validateDateNotFuture,
} from '@/lib/validation/rules';
import {
  ArrowLeft, UserPlus, CheckCircle2, AlertCircle,
  User, MapPin, Stethoscope, Phone,
} from 'lucide-react';

interface Chw { id: string; fullName: string; employeeCode?: string; assignedVillage?: string; activePatients?: number; }

type DiagnosisType = 'HIV' | 'TB' | 'HIV_TB_COINFECTION';
/** SINGLE = one village CHW (auto, read-only) · MULTIPLE = pick among village CHWs · NONE = warning + facility-wide fallback */
type CandidateMode = 'SINGLE' | 'MULTIPLE' | 'NONE';

function SectionCard({
  title, icon: Icon, iconColor = '#E64B2E', children,
}: {
  title: string; icon: React.ElementType; iconColor?: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E9E9E9' }}>
      <div
        className="flex items-center gap-2.5 px-6 py-4"
        style={{ borderBottom: '1px solid #F0F0F0' }}
      >
        <Icon size={14} style={{ color: iconColor }} />
        <h3 className="text-[13px] font-semibold text-text-primary tracking-tight">{title}</h3>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RegisterPatientPage() {
  const router = useRouter();
  const [chws, setChws]       = useState<Chw[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [done, setDone]       = useState<{ name: string; code: string } | null>(null);

  // Patient identity
  const [fullName, setFullName]   = useState('');
  const [dob, setDob]             = useState('');
  const [sex, setSex]             = useState('');
  const [nationalId, setNationalId] = useState('');
  const [phone, setPhone]         = useState('');
  const [hasSmartphone, setHasSmartphone] = useState(false);

  // Location
  const [province, setProvince]   = useState('');
  const [district, setDistrict]   = useState('');
  const [sector, setSector]       = useState('');
  const [cell, setCell]           = useState('');
  const [village, setVillage]     = useState('');
  const [householdLocation, setHouseholdLocation] = useState('');

  // Clinical
  const [diagnosis, setDiagnosis] = useState<DiagnosisType | ''>('');
  const [artStart, setArtStart]   = useState('');
  const [tbStart, setTbStart]     = useState('');

  // Consent (Rwanda Law No. 058/2021 — required before the record can be created)
  const [consentGiven, setConsentGiven] = useState(false);

  // CHW assignment — village-scoped candidates fetched as the village is typed.
  // SINGLE auto-assigns (read-only confirmation); MULTIPLE requires a pick among
  // the village CHWs; NONE warns and falls back to the facility's CHW list.
  const [candMode, setCandMode] = useState<CandidateMode | null>(null);
  const [candLoading, setCandLoading] = useState(false);
  const [candError, setCandError] = useState(false);
  const [candRetry, setCandRetry] = useState(0);
  const [assignedChwId, setAssignedChwId] = useState('');

  useEffect(() => {
    const v = village.trim();
    setAssignedChwId('');
    setCandError(false);
    if (!v) { setCandMode(null); setChws([]); setCandLoading(false); return; }
    setCandLoading(true);
    const t = setTimeout(() => {
      api.get('/api/clinical/dashboard/chw-candidates', { params: { village: v } })
        .then(r => {
          setCandMode(r.data.mode);
          const list: Chw[] = r.data.candidates ?? [];
          setChws(list);
          if (r.data.mode === 'SINGLE' && list[0]) setAssignedChwId(list[0].id);
        })
        .catch(() => { setCandMode(null); setChws([]); setCandError(true); })
        .finally(() => setCandLoading(false));
    }, 400);
    return () => clearTimeout(t);
  }, [village, candRetry]);

  const needsArt = diagnosis === 'HIV' || diagnosis === 'HIV_TB_COINFECTION';
  const needsTb  = diagnosis === 'TB'  || diagnosis === 'HIV_TB_COINFECTION';
  const today = new Date().toISOString().split('T')[0];

  function validate(): Record<string, string> {
    const errors: Record<string, string> = {};
    const fullNameError = validateRequired(fullName, 'Full name') ?? validateMaxLength(fullName, 100, 'Full name');
    if (fullNameError) errors.fullName = fullNameError;
    const dobError = validateRequired(dob, 'Date of birth') ?? validateDateNotFuture(dob, 'Date of birth');
    if (dobError) errors.dateOfBirth = dobError;
    const sexError = validateRequired(sex, 'Sex');
    if (sexError) errors.sex = sexError;
    const nationalIdError = validateNationalId(nationalId);
    if (nationalIdError) errors.nationalId = nationalIdError;
    const phoneError = validatePhone(phone);
    if (phoneError) errors.phoneNumber = phoneError;
    const diagnosisError = validateRequired(diagnosis, 'Diagnosis type');
    if (diagnosisError) errors.diagnosisType = diagnosisError;
    if (!consentGiven) {
      errors.consentGiven = 'Patient consent must be recorded before registration.';
    }
    if (!village.trim()) {
      errors.village = 'Village is required — it drives the CHW assignment.';
    } else if (!assignedChwId) {
      errors.assignedChwId = candMode === 'MULTIPLE'
        ? 'Several CHWs cover this village — please select one.'
        : candMode === 'NONE'
          ? "No CHW covers this village — select one of the facility's CHWs."
          : 'The CHW coverage lookup has not completed — retry it in the CHW Assignment section.';
    }
    return errors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Please fix the highlighted fields below.');
      return;
    }
    setLoading(true); setError(''); setFieldErrors({});
    try {
      const body = {
        fullName,
        dateOfBirth: dob,
        sex,
        nationalId:  nationalId  || undefined,
        phoneNumber: phone        || undefined,
        hasSmartphone,
        province:    province     || undefined,
        district:    district     || undefined,
        sector:      sector       || undefined,
        cell:        cell         || undefined,
        village:     village      || undefined,
        householdLocation: householdLocation || undefined,
        diagnosisType: diagnosis,
        artStartDate:  needsArt && artStart ? artStart : undefined,
        tbTreatmentStartDate: needsTb && tbStart ? tbStart : undefined,
        // Always explicit — the backend re-validates that the CHW covers the
        // patient's village (or is a facility fallback when no CHW covers it).
        assignedChwId,
        consentGiven,
        consentVersion: 'v1.0',
      };
      const r = await api.post('/api/v1/patients/register', body);
      setDone({ name: fullName, code: r.data.patientCode ?? r.data.id });
    } catch (err: unknown) {
      setFieldErrors(extractFieldErrors(err));
      setError(extractErrorMessage(err, 'Registration failed. Check all fields and try again.'));
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setDone(null);
    setFullName(''); setDob(''); setSex(''); setNationalId(''); setPhone('');
    setHasSmartphone(false); setProvince(''); setDistrict(''); setSector('');
    setCell(''); setVillage(''); setHouseholdLocation('');
    setDiagnosis(''); setArtStart(''); setTbStart(''); setConsentGiven(false);
    setCandMode(null); setAssignedChwId('');
    setFieldErrors({}); setError('');
  }

  // ── Success state ──────────────────────────────────────────────────────────

  if (done) {
    return (
      <DashboardLayout title="Register Patient">
        <div className="w-full max-w-4xl mx-auto mt-8">
          <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E9E9E9' }}>
            <div style={{ height: 3, background: '#27AE60' }} />
            <div className="px-8 py-10 text-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: 'rgba(12,122,75,0.10)' }}
              >
                <CheckCircle2 size={28} style={{ color: '#27AE60' }} />
              </div>
              <h2 className="text-[18px] font-bold text-text-primary tracking-tight">
                Patient registered
              </h2>
              <p className="text-[13px] text-text-secondary mt-1">
                {done.name} is now active in the system
              </p>
              <div
                className="mt-5 rounded-lg px-6 py-3"
                style={{ background: '#FAFAFA', border: '1px solid #E9E9E9' }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-widest text-text-hint mb-1">
                  Patient Code
                </p>
                <p className="data-num text-[22px] font-semibold" style={{ color: '#E64B2E' }}>
                  {done.code}
                </p>
              </div>
              <p className="text-[11px] text-text-hint mt-3">
                A treatment plan and dose schedule can now be assigned.
              </p>
              <p className="text-[12px] mt-2 font-medium" style={{ color: '#E67E22' }}>
                The assigned CHW has been notified — they accept the assignment before the
                full record becomes visible to them.
              </p>
              <div className="flex gap-3 mt-7 justify-center">
                <Button onClick={resetForm} icon={UserPlus}>Register Another</Button>
                <Button variant="secondary" onClick={() => router.push('/clinical/patients')}>
                  View All Patients
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout title="Register Patient">
      <div className="max-w-5xl space-y-5">

        {/* ── Page header ───────────────────────────────── */}
        <div>
          <button
            onClick={() => router.push('/clinical/patients')}
            className="flex items-center gap-1.5 text-[13px] text-text-secondary mb-5 transition-colors"
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#2C2C2C'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#6B7280'; }}
          >
            <ArrowLeft size={14} /> Back to Patients
          </button>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-text-hint mb-1">
            Clinical Dashboard
          </p>
          <h1 className="text-[20px] font-bold text-text-primary tracking-tight leading-none">
            Register New Patient
          </h1>
          <p className="text-[13px] text-text-secondary mt-1">
            Direct clinical registration — creates an active patient record with confirmed diagnosis.
          </p>
        </div>

        {/* ── Error banner ──────────────────────────────── */}
        {error && (
          <div
            className="flex items-start gap-2.5 rounded-lg p-3"
            style={{ background: 'rgba(194,40,40,0.04)', border: '1px solid #FECACA' }}
          >
            <AlertCircle size={13} className="shrink-0 mt-0.5" style={{ color: '#C0392B' }} />
            <p className="text-[12px] font-medium" style={{ color: '#C0392B' }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ── Patient identity ──────────────────────────── */}
          <SectionCard title="Patient Identity" icon={User}>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              <FormField
                label="Full Name" value={fullName} onChange={setFullName}
                placeholder="Uwimana Marie" span error={fieldErrors.fullName}
              />
              <FormField
                label="Date of Birth" value={dob} onChange={setDob}
                type="date" max={today} min="1900-01-01" error={fieldErrors.dateOfBirth}
              />
              <FormSelect label="Sex" value={sex} onChange={setSex} error={fieldErrors.sex}>
                <option value="">Select…</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </FormSelect>
              <FormField
                label="National ID" value={nationalId} onChange={setNationalId}
                required={false} placeholder="1198580000000012"
                hint="16 digits" error={fieldErrors.nationalId}
              />
              <FormField
                label="Phone Number" value={phone} onChange={setPhone}
                required={false} placeholder="0788123456"
                hint="10 digits starting with 07, or +250…" error={fieldErrors.phoneNumber}
              />
              <div className="flex items-center gap-3 pt-5">
                <input
                  id="smartphone"
                  type="checkbox"
                  checked={hasSmartphone}
                  onChange={e => setHasSmartphone(e.target.checked)}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: '#E64B2E' }}
                />
                <label htmlFor="smartphone" className="text-[13px] text-text-secondary cursor-pointer">
                  Has smartphone for app
                </label>
              </div>
            </div>
          </SectionCard>

          {/* ── Location ──────────────────────────────────── */}
          <SectionCard title="Location" icon={MapPin} iconColor="#6B7280">
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              <FormField label="Province" value={province} onChange={setProvince} required={false} placeholder="Kigali" />
              <FormField label="District" value={district} onChange={setDistrict} required={false} placeholder="Gasabo" />
              <FormField label="Sector"   value={sector}   onChange={setSector}   required={false} placeholder="Kimironko" />
              <FormField label="Cell"     value={cell}     onChange={setCell}     required={false} placeholder="Kibagabaga" />
              <FormField
                label="Village" value={village} onChange={setVillage}
                placeholder="Kagugu" error={fieldErrors.village}
                hint="Drives the CHW assignment below."
              />
              <FormField
                label="Household Location / Landmark"
                value={householdLocation} onChange={setHouseholdLocation}
                required={false} placeholder="Near Kimironko market, red gate"
                span
              />
            </div>
          </SectionCard>

          {/* ── Clinical ──────────────────────────────────── */}
          <SectionCard title="Clinical Details" icon={Stethoscope} iconColor="#E67E22">
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">

              {/* Diagnosis */}
              <div className="col-span-2 xl:col-span-1">
                <FormSelect
                  label="Diagnosis Type"
                  value={diagnosis}
                  onChange={v => setDiagnosis(v as DiagnosisType)}
                  hint="Determines which treatment dates are required."
                  error={fieldErrors.diagnosisType}
                >
                  <option value="">Select diagnosis…</option>
                  <option value="HIV">HIV</option>
                  <option value="TB">TB</option>
                  <option value="HIV_TB_COINFECTION">HIV + TB Co-infection</option>
                </FormSelect>
              </div>

              {/* ART start — shown for HIV */}
              {needsArt && (
                <FormField
                  label="ART Start Date"
                  value={artStart} onChange={setArtStart}
                  type="date" required={false} max={today}
                  hint="Date antiretroviral therapy was initiated."
                />
              )}

              {/* TB treatment start — shown for TB */}
              {needsTb && (
                <FormField
                  label="TB Treatment Start Date"
                  value={tbStart} onChange={setTbStart}
                  type="date" required={false} max={today}
                  hint="Date TB treatment regimen was initiated."
                />
              )}
            </div>

            {/* Diagnosis info banner */}
            {diagnosis && (
              <div
                className="mt-4 rounded-lg px-4 py-3 flex items-start gap-2.5"
                style={{ background: '#FAFAFA', border: '1px solid #E9E9E9' }}
              >
                <Stethoscope size={13} className="shrink-0 mt-0.5 text-text-hint" />
                <p className="text-[12px] text-text-secondary">
                  {diagnosis === 'HIV' && 'HIV diagnosis: ART initiation date and viral load monitoring will be tracked.'}
                  {diagnosis === 'TB' && 'TB diagnosis: DOT schedule and sputum follow-up will be tracked.'}
                  {diagnosis === 'HIV_TB_COINFECTION' && 'Co-infection: Both ART and TB treatment schedules will be managed concurrently.'}
                </p>
              </div>
            )}
          </SectionCard>

          {/* ── CHW assignment — village-driven ───────────── */}
          <SectionCard title="CHW Assignment" icon={Phone} iconColor="#E64B2E">

            {!village.trim() ? (
              <div
                className="rounded-lg px-4 py-3 flex items-start gap-2.5"
                style={{ background: '#FAFAFA', border: '1px solid #E9E9E9' }}
              >
                <MapPin size={13} className="shrink-0 mt-0.5 text-text-hint" />
                <p className="text-[12px] text-text-secondary">
                  Enter the patient&apos;s <strong>Village</strong> above — the CHW who covers
                  that village will be assigned automatically. If several CHWs share the
                  village you&apos;ll pick one; if none covers it you&apos;ll pick from the
                  facility&apos;s CHWs.
                </p>
              </div>
            ) : candLoading ? (
              <div
                className="px-3 py-2.5 text-[13px] rounded-lg"
                style={{ border: '1px solid #E9E9E9', color: '#9CA3AF' }}
              >
                Checking CHW coverage for “{village.trim()}”…
              </div>
            ) : candError ? (
              <div
                className="rounded-lg px-4 py-3 flex items-start gap-2.5"
                style={{ background: 'rgba(192,57,43,0.05)', border: '1px solid rgba(192,57,43,0.25)' }}
              >
                <AlertCircle size={13} className="shrink-0 mt-0.5" style={{ color: '#C0392B' }} />
                <div>
                  <p className="text-[12px] text-text-secondary">
                    <strong>Couldn&apos;t check CHW coverage for “{village.trim()}”.</strong>{' '}
                    The server may still be waking up — registration needs this lookup
                    to assign a CHW.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCandRetry(k => k + 1)}
                    className="text-[12px] font-semibold mt-1.5 underline underline-offset-2"
                    style={{ color: '#C0392B' }}
                  >
                    Retry lookup
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* NONE — warning + facility fallback */}
                {candMode === 'NONE' && (
                  <div
                    className="rounded-lg px-4 py-3 flex items-start gap-2.5 mb-4"
                    style={{ background: 'rgba(230,126,34,0.06)', border: '1px solid rgba(230,126,34,0.25)' }}
                  >
                    <AlertCircle size={13} className="shrink-0 mt-0.5" style={{ color: '#E67E22' }} />
                    <p className="text-[12px] text-text-secondary">
                      <strong>No CHW covers “{village.trim()}”.</strong> Select one of the
                      facility&apos;s CHWs below so the patient is not left unassigned.
                    </p>
                  </div>
                )}

                {/* MULTIPLE — required dropdown of village CHWs */}
                {(candMode === 'MULTIPLE' || candMode === 'NONE') && (
                  <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                    <div className="col-span-2 xl:col-span-1">
                      <label className="block text-[11px] font-semibold uppercase tracking-widest text-text-hint mb-1.5">
                        Assign to CHW <span style={{ color: '#C0392B' }}>*</span>
                      </label>
                      <ChwSelect chws={chws} value={assignedChwId} onChange={setAssignedChwId} />
                      {fieldErrors.assignedChwId
                        ? <p className="text-[11px] font-medium mt-1.5" style={{ color: '#C0392B' }}>{fieldErrors.assignedChwId}</p>
                        : <p className="text-[11px] text-text-hint mt-1.5">
                            {candMode === 'MULTIPLE'
                              ? `${chws.length} CHWs cover this village — choose who takes this patient.`
                              : 'Facility-wide list (village fallback).'}
                          </p>}
                    </div>
                  </div>
                )}

                {/* SINGLE — auto-assigned, read-only confirmation */}
                {candMode === 'SINGLE' && chws[0] && (
                  <div
                    className="rounded-lg p-4 max-w-md"
                    style={{ background: 'rgba(39,174,96,0.05)', border: '1px solid rgba(39,174,96,0.25)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                        style={{ background: '#27AE60' }}
                      >
                        {chws[0].fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-text-primary">{chws[0].fullName}</p>
                        <p className="text-[11px] text-text-hint mt-0.5">
                          Covers {chws[0].assignedVillage ?? village.trim()} — assigned automatically.
                        </p>
                      </div>
                      <CheckCircle2 size={16} className="ml-auto shrink-0" style={{ color: '#27AE60' }} />
                    </div>
                  </div>
                )}
              </>
            )}
          </SectionCard>

          {/* ── Consent (Law No. 058/2021) ─────────────────── */}
          <SectionCard title="Patient Consent" icon={CheckCircle2} iconColor="#27AE60">
            <div className="flex items-start gap-3">
              <input
                id="consent"
                type="checkbox"
                checked={consentGiven}
                onChange={e => setConsentGiven(e.target.checked)}
                className="w-4 h-4 rounded mt-0.5"
                style={{ accentColor: '#27AE60' }}
              />
              <div>
                <label htmlFor="consent" className="text-[13px] text-text-primary font-medium cursor-pointer">
                  The patient (or guardian) has given documented consent to the collection and
                  processing of their health data.
                </label>
                <p className="text-[11px] text-text-hint mt-1">
                  Required under Rwanda Law No. 058/2021 — HIV/TB status is special-category
                  sensitive data. Consent version v1.0 is recorded with a timestamp.
                </p>
                {fieldErrors.consentGiven && (
                  <p className="text-[11px] font-medium mt-1.5" style={{ color: '#C0392B' }}>
                    {fieldErrors.consentGiven}
                  </p>
                )}
              </div>
            </div>
          </SectionCard>

          {/* ── Submit ────────────────────────────────────── */}
          <div className="flex items-center gap-3 pb-2">
            <Button type="submit" icon={UserPlus} loading={loading}>
              Register Patient
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.push('/clinical/patients')}>
              Cancel
            </Button>
          </div>

        </form>
      </div>
    </DashboardLayout>
  );
}

// ── CHW select with focus state ───────────────────────────────────────────────
function ChwSelect({ chws, value, onChange }: {
  chws: Chw[]; value: string; onChange: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      value={value} required
      onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2.5 text-[13px] rounded-lg bg-white outline-none"
      style={{
        border:    focused ? '1px solid #E64B2E' : '1px solid #E9E9E9',
        boxShadow: focused ? '0 0 0 3px rgba(231,74,46,0.08)' : 'none',
      }}
      onFocus={() => setFocused(true)}
      onBlur={()  => setFocused(false)}
    >
      {chws.map(c => (
        <option key={c.id} value={c.id}>
          {c.fullName}{c.employeeCode ? ` (${c.employeeCode})` : ''}
        </option>
      ))}
    </select>
  );
}
