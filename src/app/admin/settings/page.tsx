'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import { api, extractErrorMessage } from '@/lib/api';
import { Save, Bell, Shield, Activity, Database, CheckCircle2 } from 'lucide-react';

interface SystemSettingsDto {
  missedDoseThreshold: number;
  lowStockDays: number;
  confirmWindowMinutes: number;
  highRiskThreshold: number;
  criticalRiskThreshold: number;
}

// ── Slider ────────────────────────────────────────────────────────────────────
function Slider({ label, value, min, max, step = 1, onChange, unit = '', hint }: {
  label: string; value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; unit?: string; hint?: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <label className="text-[13px] text-text-secondary">{label}</label>
        <span className="data-num text-[15px] font-semibold" style={{ color: '#006D77' }}>
          {value}{unit}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full appearance-none cursor-pointer"
        style={{ height: 5, borderRadius: 9999, accentColor: '#006D77', background: '#F5FAFB' }}
      />
      <div className="flex justify-between mt-1.5">
        <span className="data-num text-[10px] text-text-hint">{min}{unit}</span>
        <span className="data-num text-[10px] text-text-hint">{max}{unit}</span>
      </div>
      {hint && <p className="text-[11px] text-text-hint mt-2">{hint}</p>}
    </div>
  );
}

// ── Focusable input ───────────────────────────────────────────────────────────
function FormInput({ placeholder }: { placeholder?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      className="w-full px-3 py-2.5 text-[13px] rounded-lg bg-white outline-none placeholder:text-text-hint"
      placeholder={placeholder}
      style={{
        border:     focused ? '1px solid #006D77' : '1px solid #DCECF0',
        boxShadow:  focused ? '0 0 0 3px rgba(0,95,107,0.08)' : 'none',
      }}
      onFocus={() => setFocused(true)}
      onBlur={()  => setFocused(false)}
    />
  );
}

// ── Section card ─────────────────────────────────────────────────────────────
function SectionCard({
  id, title, badge, children,
}: {
  id: string; title: string;
  badge: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div id={id} className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #DCECF0' }}>
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid #E8F4F8' }}
      >
        <h3 className="text-[13px] font-semibold text-text-primary tracking-tight">{title}</h3>
        {badge}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ── Settings nav link ─────────────────────────────────────────────────────────
function NavLink({ href, icon: Icon, label, color }: {
  href: string; icon: React.ElementType; label: string; color: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors"
      style={{ color: '#5A6474' }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLAnchorElement).style.background = '#F5FAFB';
        (e.currentTarget as HTMLAnchorElement).style.color = '#1A1A2E';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLAnchorElement).style.background = '';
        (e.currentTarget as HTMLAnchorElement).style.color = '#5A6474';
      }}
    >
      <Icon size={14} style={{ color }} />
      {label}
    </a>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [thresholds, setThresholds] = useState({
    missedDoseAlert: 3,
    confirmationWindowMinutes: 45,
    highRiskScore: 70,
    criticalRiskScore: 85,
  });
  const [lowStockDays, setLowStockDays] = useState(14); // not shown in this UI, preserved on save
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<SystemSettingsDto>('/api/admin/settings')
      .then((r) => {
        const d = r.data;
        setThresholds({
          missedDoseAlert: d.missedDoseThreshold,
          confirmationWindowMinutes: d.confirmWindowMinutes,
          highRiskScore: d.highRiskThreshold,
          criticalRiskScore: d.criticalRiskThreshold,
        });
        setLowStockDays(d.lowStockDays);
      })
      .catch(() => setError('Failed to load current settings. Showing defaults.'))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    setError('');
    try {
      await api.put('/api/admin/settings', {
        missedDoseThreshold: thresholds.missedDoseAlert,
        lowStockDays,
        confirmWindowMinutes: thresholds.confirmationWindowMinutes,
        highRiskThreshold: thresholds.highRiskScore,
        criticalRiskThreshold: thresholds.criticalRiskScore,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: unknown) {
            setError(extractErrorMessage(err, 'Failed to save settings. Try again.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout title="System Settings">

      {/* ── Page header ─────────────────────────────────── */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-text-hint mb-1">
            System Administration
          </p>
          <h1 className="text-[20px] font-bold text-text-primary tracking-tight leading-none">
            System Settings
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Button icon={Save} onClick={save} disabled={loading || saving}>
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Settings'}
          </Button>
          {saved && (
            <div className="flex items-center gap-1.5 text-[13px] font-medium" style={{ color: '#27AE60' }}>
              <CheckCircle2 size={14} />
              Saved successfully
            </div>
          )}
        </div>
      </div>

      {error && (
        <div
          className="flex items-start gap-2.5 rounded-lg p-3 mb-5"
          style={{ background: 'rgba(194,40,40,0.04)', border: '1px solid #FECACA' }}
        >
          <p className="text-[12px] font-medium" style={{ color: '#C0392B' }}>{error}</p>
        </div>
      )}

      {/* ── Two-column layout ────────────────────────────── */}
      <div className="flex gap-8 items-start" style={{ opacity: loading ? 0.5 : 1, pointerEvents: loading ? 'none' : 'auto' }}>

        {/* Left: sticky settings nav */}
        <nav className="w-48 shrink-0 sticky top-8">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-text-hint px-3 mb-2">
            Sections
          </p>
          <div className="space-y-0.5">
            <NavLink href="#alerts"   icon={Bell}     label="Alert Thresholds"  color="#006D77" />
            <NavLink href="#risk"     icon={Activity} label="Risk Thresholds"   color="#E67E22" />
            <NavLink href="#fhir"     icon={Database} label="FHIR Integration"  color="#2980B9" />
            <NavLink href="#security" icon={Shield}   label="Security"          color="#2980B9" />
          </div>
        </nav>

        {/* Right: settings content */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* ── Alert thresholds ─────────────────────────── */}
          <SectionCard
            id="alerts"
            title="Alert Thresholds"
            badge={
              <div className="flex items-center gap-1.5" style={{ color: '#006D77' }}>
                <Bell size={13} />
                <span className="text-[11px] font-semibold uppercase tracking-wide">Notification</span>
              </div>
            }
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Slider
                label="Missed Dose Alert (consecutive doses)"
                unit=" doses"
                value={thresholds.missedDoseAlert}
                min={1} max={7}
                hint="Alert is raised after this many consecutive missed doses."
                onChange={(v) => setThresholds(p => ({ ...p, missedDoseAlert: v }))}
              />
              <Slider
                label="Confirmation Window Duration"
                unit=" min"
                value={thresholds.confirmationWindowMinutes}
                min={15} max={120} step={15}
                hint="Time window after scheduled dose time for patient to confirm."
                onChange={(v) => setThresholds(p => ({ ...p, confirmationWindowMinutes: v }))}
              />
            </div>
          </SectionCard>

          {/* ── Risk thresholds ──────────────────────────── */}
          <SectionCard
            id="risk"
            title="AI Risk Score Thresholds"
            badge={
              <div className="flex items-center gap-1.5" style={{ color: '#E67E22' }}>
                <Activity size={13} />
                <span className="text-[11px] font-semibold uppercase tracking-wide">Risk Engine</span>
              </div>
            }
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Slider
                label="High Risk Threshold"
                unit=" pts"
                value={thresholds.highRiskScore}
                min={50} max={85}
                hint={`Patients scoring ≥ ${thresholds.highRiskScore} are flagged HIGH risk.`}
                onChange={(v) => setThresholds(p => ({ ...p, highRiskScore: v }))}
              />
              <Slider
                label="Critical Risk Threshold"
                unit=" pts"
                value={thresholds.criticalRiskScore}
                min={70} max={99}
                hint={`Patients scoring ≥ ${thresholds.criticalRiskScore} are flagged CRITICAL.`}
                onChange={(v) => setThresholds(p => ({ ...p, criticalRiskScore: v }))}
              />
            </div>

            {/* Visual risk scale */}
            <div className="mt-6 pt-5" style={{ borderTop: '1px solid #E8F4F8' }}>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-text-hint mb-3">
                Risk Scale Preview
              </p>
              <div className="flex items-center gap-0 rounded-lg overflow-hidden h-6">
                <div
                  className="flex items-center justify-center text-[10px] font-semibold text-white"
                  style={{ background: '#27AE60', width: `${thresholds.highRiskScore}%`, minWidth: 40 }}
                >
                  Low
                </div>
                <div
                  className="flex items-center justify-center text-[10px] font-semibold text-white"
                  style={{
                    background: '#E67E22',
                    width: `${thresholds.criticalRiskScore - thresholds.highRiskScore}%`,
                    minWidth: 40,
                  }}
                >
                  High
                </div>
                <div
                  className="flex-1 flex items-center justify-center text-[10px] font-semibold text-white"
                  style={{ background: '#C0392B', minWidth: 40 }}
                >
                  Critical
                </div>
              </div>
              <div className="flex justify-between mt-1">
                <span className="data-num text-[10px] text-text-hint">0</span>
                <span className="data-num text-[10px]" style={{ color: '#E67E22' }}>
                  {thresholds.highRiskScore}
                </span>
                <span className="data-num text-[10px]" style={{ color: '#C0392B' }}>
                  {thresholds.criticalRiskScore}
                </span>
                <span className="data-num text-[10px] text-text-hint">100</span>
              </div>
            </div>
          </SectionCard>

          {/* ── FHIR integration ─────────────────────────── */}
          <SectionCard
            id="fhir"
            title="FHIR Integration"
            badge={
              <div className="flex items-center gap-1.5" style={{ color: '#2980B9' }}>
                <Database size={13} />
                <span className="text-[11px] font-semibold uppercase tracking-wide">HL7 FHIR R4</span>
              </div>
            }
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* EHR URL */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-text-hint mb-1.5">
                  EHR Base URL
                </label>
                <FormInput placeholder="https://fhir.facility.rw/fhir" />
                <p className="text-[11px] text-text-hint mt-2">
                  HAPI FHIR R4 endpoint for bi-directional patient data exchange.
                </p>
              </div>

              {/* Connection status */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-text-hint mb-1.5">
                  Connection Status
                </label>
                <div
                  className="rounded-lg px-4 py-3"
                  style={{ background: 'rgba(12,122,75,0.05)', border: '1px solid #BBF7D0' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full live-pulse shrink-0" style={{ background: '#27AE60' }} />
                      <span className="text-[13px] font-semibold" style={{ color: '#27AE60' }}>
                        Connected
                      </span>
                    </div>
                    <span className="data-num text-[11px]" style={{ color: '#27AE60' }}>
                      Last sync: 5m ago
                    </span>
                  </div>
                  <p className="text-[11px] mt-2" style={{ color: '#27AE60', opacity: 0.7 }}>
                    HAPI FHIR Server · hapi.fhir.org/baseR4
                  </p>
                </div>
                <p className="text-[11px] text-text-hint mt-2">
                  Patient resources are synced on registration and visit record.
                </p>
              </div>
            </div>
          </SectionCard>

          {/* ── Security ─────────────────────────────────── */}
          <SectionCard
            id="security"
            title="Security"
            badge={
              <div className="flex items-center gap-1.5" style={{ color: '#2980B9' }}>
                <Shield size={13} />
                <span className="text-[11px] font-semibold uppercase tracking-wide">Access Control</span>
              </div>
            }
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              {[
                { label: 'AES-256 data encryption at rest',      detail: 'All stored patient data is encrypted' },
                { label: 'TLS 1.3 in transit',                   detail: 'All API communication is encrypted'  },
                { label: 'JWT token expiry: 15 minutes',         detail: 'Sessions expire after inactivity'    },
                { label: 'Failed login lockout after 3 attempts', detail: 'Brute-force protection enabled'     },
                { label: 'Audit logging for all data events',    detail: 'Full tamper-evident audit trail'     },
                { label: 'Role-based access control (RBAC)',     detail: 'Scoped permissions per role'         },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-start gap-3 py-3"
                  style={{ borderBottom: '1px solid #E8F4F8' }}
                >
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: 'rgba(12,122,75,0.10)' }}
                  >
                    <CheckCircle2 size={12} style={{ color: '#27AE60' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] text-text-secondary">{item.label}</p>
                    <p className="text-[11px] text-text-hint mt-0.5">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

        </div>
      </div>
    </DashboardLayout>
  );
}
