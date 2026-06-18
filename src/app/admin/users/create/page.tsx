'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import { api } from '@/lib/api';
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

// ── Shared input primitives ───────────────────────────────────────────────────

function FormField({
  label, name, value, onChange, type = 'text', required = true, placeholder = '',
}: {
  label: string; name: string; value: string;
  onChange: (v: string) => void; type?: string;
  required?: boolean; placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-widest text-text-hint mb-1.5">
        {label}{required && <span className="ml-0.5" style={{ color: '#C0392B' }}>*</span>}
      </label>
      <input
        type={type} name={name} value={value} required={required} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 text-[13px] rounded-lg bg-white outline-none placeholder:text-text-hint"
        style={{
          border:     focused ? '1px solid #006D77' : '1px solid #DCECF0',
          boxShadow:  focused ? '0 0 0 3px rgba(0,95,107,0.08)' : 'none',
        }}
        onFocus={() => setFocused(true)}
        onBlur={()  => setFocused(false)}
      />
    </div>
  );
}

function FormSelect({
  label, value, onChange, required = true, children,
}: {
  label: string; value: string; onChange: (v: string) => void;
  required?: boolean; children: React.ReactNode;
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
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CreateUserPage() {
  const router = useRouter();
  const [role, setRole]             = useState<Role>('CHW');
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading]       = useState(false);
  const [done, setDone]             = useState<{ name: string; tempPass: string } | null>(null);
  const [error, setError]           = useState('');

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const phoneDigits = phone.replace(/\s/g, '');
    if (!/^\+?[0-9]{10,13}$/.test(phoneDigits)) {
      setError('Phone number must be 10–13 digits (e.g. +250 7XX XXX XXX).');
      return;
    }
    setLoading(true); setError('');
    const base = { fullName, email, phoneNumber: phone, facilityId };
    const body =
      role === 'CHW'               ? { ...base, assignedVillage: village, assignedSector: sector, employeeCode: empCode } :
      role === 'FACILITY_PROVIDER' ? { ...base, specialization: specialization || undefined, licenseNumber: licenseNumber || undefined } :
                                     { ...base, district };
    try {
      const r = await api.post(ROLE_ENDPOINTS[role], body);
      setDone({ name: fullName, tempPass: r.data.temporaryPassword ?? r.data.tempPassword ?? '(see email)' });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Failed to create user. Check the fields and try again.');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setDone(null);
    setFullName(''); setEmail(''); setPhone('');
    setVillage(''); setSector(''); setEmpCode('');
    setSpec(''); setLicense(''); setDistrict('');
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
                  <FormField label="Full Name"    name="fullName" value={fullName} onChange={setFullName} placeholder="Jean Pierre Nkurunziza" />
                  <FormField label="Email"        name="email"    value={email}    onChange={setEmail}    type="email" placeholder="j.pierre@facility.rw" />
                  <FormField label="Phone Number" name="phone"    value={phone}    onChange={setPhone}    placeholder="+250 7XX XXX XXX" />
                  <FormSelect
                    label="Facility"
                    value={facilityId}
                    onChange={setFacilityId}
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
                    <FormField label="Employee Code"    name="empCode" value={empCode} onChange={setEmpCode} placeholder="CHW-001" />
                    <FormField label="Assigned Village" name="village" value={village} onChange={setVillage} placeholder="Kimironko" />
                    <FormField label="Assigned Sector"  name="sector"  value={sector}  onChange={setSector}  placeholder="Gasabo" />
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
                    <FormField label="District" name="district" value={district} onChange={setDistrict} placeholder="Gasabo" />
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
