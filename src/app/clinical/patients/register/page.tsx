'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import { api, extractErrorMessage } from '@/lib/api';
import {
  ArrowLeft, UserPlus, CheckCircle2, AlertCircle,
  User, MapPin, Stethoscope, Phone,
} from 'lucide-react';

interface Chw { id: string; fullName: string; employeeCode?: string; assignedVillage?: string; }

type DiagnosisType = 'HIV' | 'TB' | 'HIV_TB_COINFECTION';

// ── Shared input primitives ───────────────────────────────────────────────────

function FormField({
  label, value, onChange, type = 'text', required = true,
  placeholder = '', hint, span, max, min,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; placeholder?: string;
  hint?: string; span?: boolean; max?: string; min?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className={span ? 'col-span-2' : ''}>
      <label className="block text-[11px] font-semibold uppercase tracking-widest text-text-hint mb-1.5">
        {label}{required && <span className="ml-0.5" style={{ color: '#C0392B' }}>*</span>}
      </label>
      <input
        type={type} value={value} required={required} placeholder={placeholder}
        max={max} min={min}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 text-[13px] rounded-lg bg-white outline-none placeholder:text-text-hint"
        style={{
          border:    focused ? '1px solid #006D77' : '1px solid #DCECF0',
          boxShadow: focused ? '0 0 0 3px rgba(0,95,107,0.08)' : 'none',
        }}
        onFocus={() => setFocused(true)}
        onBlur={()  => setFocused(false)}
      />
      {hint && <p className="text-[11px] text-text-hint mt-1.5">{hint}</p>}
    </div>
  );
}

function FormSelect({
  label, value, onChange, required = true, children, hint,
}: {
  label: string; value: string; onChange: (v: string) => void;
  required?: boolean; children: React.ReactNode; hint?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-widest text-text-hint mb-1.5">
        {label}{required && <span className="ml-0.5" style={{ color: '#C0392B' }}>*</span>}
      </label>
      <select
        value={value} required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 text-[13px] rounded-lg bg-white outline-none"
        style={{
          border:    focused ? '1px solid #006D77' : '1px solid #DCECF0',
          boxShadow: focused ? '0 0 0 3px rgba(0,95,107,0.08)' : 'none',
        }}
        onFocus={() => setFocused(true)}
        onBlur={()  => setFocused(false)}
      >
        {children}
      </select>
      {hint && <p className="text-[11px] text-text-hint mt-1.5">{hint}</p>}
    </div>
  );
}

function SectionCard({
  title, icon: Icon, iconColor = '#006D77', children,
}: {
  title: string; icon: React.ElementType; iconColor?: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #DCECF0' }}>
      <div
        className="flex items-center gap-2.5 px-6 py-4"
        style={{ borderBottom: '1px solid #E8F4F8' }}
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

  // CHW assignment — manual pick, or auto-match by village/sector
  const [assignmentMode, setAssignmentMode] = useState<'MANUAL' | 'AUTO'>('MANUAL');
  const [assignedChwId, setAssignedChwId] = useState('');

  useEffect(() => {
    api.get('/api/clinical/dashboard/chws')
      .then(r => {
        setChws(r.data);
        if (r.data[0]) setAssignedChwId(r.data[0].id);
      })
      .catch(console.error);
  }, []);

  const needsArt = diagnosis === 'HIV' || diagnosis === 'HIV_TB_COINFECTION';
  const needsTb  = diagnosis === 'TB'  || diagnosis === 'HIV_TB_COINFECTION';
  const today = new Date().toISOString().split('T')[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!diagnosis) { setError('Please select a diagnosis type.'); return; }
    if (assignmentMode === 'AUTO' && !village.trim() && !sector.trim()) {
      setError('Auto-assign needs at least a Village or Sector to match against a CHW\'s coverage area.');
      return;
    }
    setLoading(true); setError('');
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
        // Omitted entirely in AUTO mode — backend matches a CHW by village/sector
        // (PatientService#matchChwByLocation) and the assignment starts PENDING
        // until that CHW accepts it.
        assignedChwId: assignmentMode === 'MANUAL' ? assignedChwId : undefined,
      };
      const r = await api.post('/api/v1/patients/register', body);
      setDone({ name: fullName, code: r.data.patientCode ?? r.data.id });
    } catch (err: unknown) {
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
    setDiagnosis(''); setArtStart(''); setTbStart(''); setAssignmentMode('MANUAL');
  }

  // ── Success state ──────────────────────────────────────────────────────────

  if (done) {
    return (
      <DashboardLayout title="Register Patient">
        <div className="w-full max-w-4xl mx-auto mt-8">
          <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #DCECF0' }}>
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
                style={{ background: '#EDF6F9', border: '1px solid #DCECF0' }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-widest text-text-hint mb-1">
                  Patient Code
                </p>
                <p className="data-num text-[22px] font-semibold" style={{ color: '#006D77' }}>
                  {done.code}
                </p>
              </div>
              <p className="text-[11px] text-text-hint mt-3">
                A treatment plan and dose schedule can now be assigned.
              </p>
              {assignmentMode === 'AUTO' && (
                <p className="text-[12px] mt-2 font-medium" style={{ color: '#E67E22' }}>
                  CHW matched by location — awaiting their acceptance before the full record is visible to them.
                </p>
              )}
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
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#1A1A2E'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#5A6474'; }}
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
                placeholder="Uwimana Marie" span
              />
              <FormField
                label="Date of Birth" value={dob} onChange={setDob}
                type="date" max={today} min="1900-01-01"
              />
              <FormSelect label="Sex" value={sex} onChange={setSex}>
                <option value="">Select…</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </FormSelect>
              <FormField
                label="National ID" value={nationalId} onChange={setNationalId}
                required={false} placeholder="1198580000000012"
              />
              <FormField
                label="Phone Number" value={phone} onChange={setPhone}
                required={false} placeholder="+250 7XX XXX XXX"
              />
              <div className="flex items-center gap-3 pt-5">
                <input
                  id="smartphone"
                  type="checkbox"
                  checked={hasSmartphone}
                  onChange={e => setHasSmartphone(e.target.checked)}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: '#006D77' }}
                />
                <label htmlFor="smartphone" className="text-[13px] text-text-secondary cursor-pointer">
                  Has smartphone for app
                </label>
              </div>
            </div>
          </SectionCard>

          {/* ── Location ──────────────────────────────────── */}
          <SectionCard title="Location" icon={MapPin} iconColor="#5A6474">
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              <FormField label="Province" value={province} onChange={setProvince} required={false} placeholder="Kigali" />
              <FormField label="District" value={district} onChange={setDistrict} required={false} placeholder="Gasabo" />
              <FormField label="Sector"   value={sector}   onChange={setSector}   required={false} placeholder="Kimironko" />
              <FormField label="Cell"     value={cell}     onChange={setCell}     required={false} placeholder="Kibagabaga" />
              <FormField label="Village"  value={village}  onChange={setVillage}  required={false} placeholder="Kagugu" />
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
                style={{ background: '#EDF6F9', border: '1px solid #DCECF0' }}
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

          {/* ── CHW assignment ────────────────────────────── */}
          <SectionCard title="CHW Assignment" icon={Phone} iconColor="#006D77">

            {/* Mode toggle */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <AssignmentModeOption
                active={assignmentMode === 'MANUAL'}
                onClick={() => setAssignmentMode('MANUAL')}
                title="Select CHW manually"
                description="Pick a specific CHW from the list."
              />
              <AssignmentModeOption
                active={assignmentMode === 'AUTO'}
                onClick={() => setAssignmentMode('AUTO')}
                title="Auto-assign by location"
                description="Match a CHW whose coverage area includes this patient's village/sector."
              />
            </div>

            {assignmentMode === 'MANUAL' ? (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                <div className="col-span-2 xl:col-span-1">
                  <label className="block text-[11px] font-semibold uppercase tracking-widest text-text-hint mb-1.5">
                    Assigned CHW <span style={{ color: '#C0392B' }}>*</span>
                  </label>
                  {chws.length === 0 ? (
                    <div
                      className="px-3 py-2.5 text-[13px] rounded-lg"
                      style={{ border: '1px solid #DCECF0', color: '#AAB4BC' }}
                    >
                      Loading CHWs…
                    </div>
                  ) : (
                    <ChwSelect
                      chws={chws}
                      value={assignedChwId}
                      onChange={setAssignedChwId}
                    />
                  )}
                  <p className="text-[11px] text-text-hint mt-1.5">
                    This CHW will conduct home visits and confirm daily doses.
                  </p>
                </div>

                {/* Selected CHW card */}
                {assignedChwId && chws.length > 0 && (() => {
                  const chw = chws.find(c => c.id === assignedChwId);
                  if (!chw) return null;
                  return (
                    <div
                      className="rounded-lg p-4"
                      style={{ background: 'rgba(0,95,107,0.04)', border: '1px solid rgba(0,95,107,0.15)' }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                          style={{ background: '#006D77' }}
                        >
                          {chw.fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-text-primary">{chw.fullName}</p>
                          <p className="data-num text-[11px] text-text-hint mt-0.5">
                            {chw.employeeCode ?? '—'}
                            {chw.assignedVillage ? ` · ${chw.assignedVillage}` : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div
                className="rounded-lg px-4 py-3 flex items-start gap-2.5"
                style={{ background: 'rgba(230,126,34,0.06)', border: '1px solid rgba(230,126,34,0.25)' }}
              >
                <MapPin size={13} className="shrink-0 mt-0.5" style={{ color: '#E67E22' }} />
                <p className="text-[12px] text-text-secondary">
                  The system will match a CHW whose coverage area includes the{' '}
                  <strong>Village</strong> (falling back to <strong>Sector</strong>) entered above.
                  The CHW will see a masked notification — name and diagnosis stay hidden until they
                  accept the assignment. If no CHW covers this location, registration will fail and
                  you&apos;ll need to switch to manual selection.
                </p>
              </div>
            )}
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

// ── CHW assignment mode toggle ────────────────────────────────────────────────
function AssignmentModeOption({
  active, onClick, title, description,
}: {
  active: boolean; onClick: () => void; title: string; description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left rounded-lg p-3.5 transition-colors"
      style={{
        border:     active ? '1.5px solid #006D77' : '1px solid #DCECF0',
        background: active ? 'rgba(0,95,107,0.04)' : '#FFFFFF',
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0"
          style={{ border: active ? '4px solid #006D77' : '1.5px solid #AAB4BC' }}
        />
        <p className="text-[13px] font-semibold text-text-primary">{title}</p>
      </div>
      <p className="text-[11px] text-text-hint mt-1 ml-[22px]">{description}</p>
    </button>
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
        border:    focused ? '1px solid #006D77' : '1px solid #DCECF0',
        boxShadow: focused ? '0 0 0 3px rgba(0,95,107,0.08)' : 'none',
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
