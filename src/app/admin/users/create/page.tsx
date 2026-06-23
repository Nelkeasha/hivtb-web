'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import FormField from '@/components/ui/FormField';
import FormSelect from '@/components/ui/FormSelect';
import { api, extractErrorMessage, extractFieldErrors } from '@/lib/api';
import {
  required as validateRequired, phone as validatePhone, email as validateEmail,
  employeeCode as validateEmployeeCode, maxLength as validateMaxLength,
} from '@/lib/validation/rules';
import { UserPlus, CheckCircle2, ArrowLeft } from 'lucide-react';

type Role = 'CHW' | 'FACILITY_PROVIDER' | 'SUPERVISOR';

interface Facility { id: string; name: string; district?: string; }

const ROLE_LABELS: Record<Role, string> = {
  CHW:               'Community Health Worker',
  FACILITY_PROVIDER: 'Clinical Staff / Provider',
  SUPERVISOR:        'Supervisor',
};

const ROLE_ENDPOINTS: Record<Role, string> = {
  CHW:               '/api/admin/users/chw',
  FACILITY_PROVIDER: '/api/admin/users/provider',
  SUPERVISOR:        '/api/admin/users/supervisor',
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CreateUserPage() {
  const router = useRouter();
  const [role, setRole]             = useState<Role>('CHW');
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading]       = useState(false);
  const [done, setDone]             = useState<{ name: string; tempPass: string } | null>(null);
  const [error, setError]           = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [fullName, setFullName]   = useState('');
  const [email, setEmail]         = useState('');
  const [phone, setPhone]         = useState('');
  const [facilityId, setFacilityId] = useState('');

  const [village, setVillage]     = useState('');
  const [sector, setSector]       = useState('');
  const [empCode, setEmpCode]     = useState('');
  const [specialization, setSpec] = useState('');
  const [licenseNumber, setLicense] = useState('');
  const [district, setDistrict]   = useState('');

  useEffect(() => {
    api.get('/api/admin/users/facilities')
      .then((r) => { setFacilities(r.data); if (r.data[0]) setFacilityId(r.data[0].id); })
      .catch(console.error);
  }, []);

  function validate(): Record<string, string> {
    const errors: Record<string, string> = {};
    const nameError = validateRequired(fullName, 'Full name') ?? validateMaxLength(fullName, 100, 'Full name');
    if (nameError) errors.fullName = nameError;
    const emailError = validateEmail(email, { required: true }) ?? validateMaxLength(email, 100, 'Email');
    if (emailError) errors.email = emailError;
    const phoneError = validatePhone(phone, { required: true });
    if (phoneError) errors.phoneNumber = phoneError;
    if (!facilityId) errors.facilityId = 'Please select a facility';
    if (role === 'CHW') {
      const villageError = validateRequired(village, 'Assigned village') ?? validateMaxLength(village, 100, 'Assigned village');
      if (villageError) errors.village = villageError;
      const sectorError = validateRequired(sector, 'Assigned sector') ?? validateMaxLength(sector, 100, 'Assigned sector');
      if (sectorError) errors.sector = sectorError;
      const empCodeError = validateEmployeeCode(empCode);
      if (empCodeError) errors.empCode = empCodeError;
    }
    if (role === 'SUPERVISOR') {
      const districtError = validateRequired(district, 'District') ?? validateMaxLength(district, 100, 'District');
      if (districtError) errors.district = districtError;
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
    const base = { fullName, email, phoneNumber: phone, facilityId };
    const body =
      role === 'CHW'               ? { ...base, assignedVillage: village, assignedSector: sector, employeeCode: empCode } :
      role === 'FACILITY_PROVIDER' ? { ...base, specialization: specialization || undefined, licenseNumber: licenseNumber || undefined } :
                                     { ...base, district };
    try {
      const r = await api.post(ROLE_ENDPOINTS[role], body);
      setDone({ name: fullName, tempPass: r.data.temporaryPassword ?? r.data.tempPassword ?? '(see email)' });
    } catch (err: unknown) {
      setFieldErrors(extractFieldErrors(err));
      setError(extractErrorMessage(err, 'Failed to create user. Check the fields and try again.'));
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setDone(null);
    setFullName(''); setEmail(''); setPhone('');
    setVillage(''); setSector(''); setEmpCode('');
    setSpec(''); setLicense(''); setDistrict('');
    setFieldErrors({}); setError('');
  }

  // ── Success state ──────────────────────────────────────────────────────────

  if (done) {
    return (
      <DashboardLayout title="Create User">
        <div className="w-full max-w-4xl mx-auto">
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
                Account created
              </h2>
              <p className="text-[13px] text-text-secondary mt-1">
                {done.name} can now log in
              </p>

              <div className="mt-6 mb-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-text-hint mb-3">
                  Temporary Password
                </p>
                <div
                  className="rounded-lg px-6 py-4"
                  style={{ background: '#EDF6F9', border: '1px solid #DCECF0' }}
                >
                  <p
                    className="data-num text-[26px] font-semibold tracking-widest"
                    style={{ color: '#006D77' }}
                  >
                    {done.tempPass}
                  </p>
                </div>
                <p className="text-[11px] text-text-hint mt-2">
                  Share this securely. User must change it on first login.
                </p>
              </div>

              <div className="flex gap-3 mt-7 justify-center">
                <Button onClick={resetForm}>Add Another</Button>
                <Button variant="secondary" onClick={() => router.push('/admin/users')}>
                  Back to Users
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
    <DashboardLayout title="Create User">
      <div className="max-w-5xl space-y-5">

        {/* ── Page header ───────────────────────────────── */}
        <div>
          <button
            onClick={() => router.push('/admin/users')}
            className="flex items-center gap-1.5 text-[13px] text-text-secondary mb-5 transition-colors"
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#1A1A2E'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#5A6474'; }}
          >
            <ArrowLeft size={14} /> Back to Users
          </button>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-text-hint mb-1">
            System Administration
          </p>
          <h1 className="text-[20px] font-bold text-text-primary tracking-tight leading-none">
            New Staff Account
          </h1>
        </div>

        <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #DCECF0' }}>

          {/* Card header */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: '1px solid #E8F4F8' }}
          >
            <div>
              <h3 className="text-[13px] font-semibold text-text-primary tracking-tight">
                Create Account
              </h3>
              <p className="text-[11px] text-text-hint mt-0.5">
                Generates a system account with a temporary password
              </p>
            </div>
            <div className="flex items-center gap-1.5" style={{ color: '#006D77' }}>
              <UserPlus size={13} />
              <span className="text-[11px] font-semibold uppercase tracking-wide">Admin only</span>
            </div>
          </div>

          <div className="px-6 pb-6 pt-5">

            {/* Error banner */}
            {error && (
              <div
                className="flex items-start gap-2.5 rounded-lg p-3 mb-5"
                style={{ background: 'rgba(194,40,40,0.04)', border: '1px solid #FECACA' }}
              >
                <p className="text-[12px] font-medium" style={{ color: '#C0392B' }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Role selector */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-text-hint mb-2">
                  Role <span style={{ color: '#C0392B' }}>*</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-3 gap-3">
                  {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className="p-3 rounded-lg text-left transition-all"
                      style={{
                        border:     role === r ? '1px solid #006D77' : '1px solid #DCECF0',
                        background: role === r ? 'rgba(0,95,107,0.06)' : '#EDF6F9',
                        color:      role === r ? '#006D77' : '#5A6474',
                      }}
                    >
                      {role === r && (
                        <div
                          className="w-1.5 h-1.5 rounded-full mb-2"
                          style={{ background: '#006D77' }}
                        />
                      )}
                      <p className="text-[12px] font-semibold leading-snug">
                        {ROLE_LABELS[r]}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div style={{ borderTop: '1px solid #E8F4F8' }} />

              {/* Common fields */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-text-hint mb-3">
                  Account Details
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                  <FormField label="Full Name"    name="fullName" value={fullName} onChange={setFullName} placeholder="Jean Pierre Nkurunziza" error={fieldErrors.fullName} />
                  <FormField label="Email"        name="email"    value={email}    onChange={setEmail}    type="email" placeholder="j.pierre@facility.rw" error={fieldErrors.email} />
                  <FormField label="Phone Number" name="phone"    value={phone}    onChange={setPhone}    placeholder="0788123456" hint="10 digits starting with 07, or +250…" error={fieldErrors.phoneNumber} />
                  <FormSelect
                    label="Facility"
                    value={facilityId}
                    onChange={setFacilityId}
                    error={fieldErrors.facilityId}
                  >
                    {facilities.length === 0 && <option value="">Loading…</option>}
                    {facilities.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}{f.district ? ` — ${f.district}` : ''}
                      </option>
                    ))}
                  </FormSelect>
                </div>
              </div>

              {/* Role-specific fields */}
              {role === 'CHW' && (
                <div
                  className="rounded-lg p-4"
                  style={{ background: '#EDF6F9', border: '1px solid #DCECF0' }}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-text-hint mb-3">
                    CHW Details
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <FormField label="Employee Code"    name="empCode" value={empCode} onChange={setEmpCode} placeholder="CHW-001" error={fieldErrors.empCode} />
                    <FormField label="Assigned Village" name="village" value={village} onChange={setVillage} placeholder="Kimironko" error={fieldErrors.village} />
                    <FormField label="Assigned Sector"  name="sector"  value={sector}  onChange={setSector}  placeholder="Gasabo" error={fieldErrors.sector} />
                  </div>
                </div>
              )}

              {role === 'FACILITY_PROVIDER' && (
                <div
                  className="rounded-lg p-4"
                  style={{ background: '#EDF6F9', border: '1px solid #DCECF0' }}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-text-hint mb-3">
                    Provider Details
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField label="Specialization" name="spec"    value={specialization} onChange={setSpec}     required={false} placeholder="Internal Medicine" />
                    <FormField label="License Number" name="license" value={licenseNumber}  onChange={setLicense}  required={false} placeholder="RMC-XXXX" />
                  </div>
                </div>
              )}

              {role === 'SUPERVISOR' && (
                <div
                  className="rounded-lg p-4"
                  style={{ background: '#EDF6F9', border: '1px solid #DCECF0' }}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-text-hint mb-3">
                    Supervisor Details
                  </p>
                  <div className="max-w-xs">
                    <FormField label="District" name="district" value={district} onChange={setDistrict} placeholder="Gasabo" error={fieldErrors.district} />
                  </div>
                </div>
              )}

              {/* Submit */}
              <div className="flex items-center gap-3 pt-1">
                <Button type="submit" icon={UserPlus} loading={loading}>
                  Create Account
                </Button>
                <Button type="button" variant="secondary" onClick={() => router.push('/admin/users')}>
                  Cancel
                </Button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
