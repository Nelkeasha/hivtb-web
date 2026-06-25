'use client';
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, FileText, FileSpreadsheet, FileDown, AlertCircle, X } from 'lucide-react';
import { downloadReport } from '@/lib/utils';

interface Props {
  /** Backend export endpoint, without the `?format=` query string, e.g. `/api/clinical/dashboard/reports/summary/export`. */
  baseUrl: string;
  /** Filename prefix used as a fallback if the server doesn't send Content-Disposition, e.g. `facility-report`. */
  filenamePrefix: string;
  label?: string;
}

interface FormatOption {
  value: 'pdf' | 'excel' | 'csv';
  label: string;
  ext: string;
  icon: typeof FileText;
  desc: string;
}

const FORMATS: FormatOption[] = [
  { value: 'pdf',   label: 'PDF',   ext: 'pdf',  icon: FileText,        desc: 'Official printable document' },
  { value: 'excel', label: 'Excel', ext: 'xlsx', icon: FileSpreadsheet, desc: 'Multi-sheet workbook for analysis' },
  { value: 'csv',   label: 'CSV',   ext: 'csv',  icon: FileDown,        desc: 'Flat file for system integration' },
];

/** Format-select dropdown reused by every report page — lets any role download the same report as PDF, Excel, or CSV instead of being locked to one fixed format. */
export default function ExportMenu({ baseUrl, filenamePrefix, label = 'Export Report' }: Props) {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [exportError, setExportError] = useState('');
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleSelect(fmt: FormatOption) {
    setDownloading(fmt.value);
    setExportError('');
    try {
      await downloadReport(`${baseUrl}?format=${fmt.value}`, `${filenamePrefix}.${fmt.ext}`);
      setOpen(false);
    } catch (err) {
      setOpen(false);
      const status = (err as { response?: { status?: number } })?.response?.status;
      const code   = (err as { code?: string })?.code;
      if (status === 401)               setExportError('Session expired — please refresh the page and sign in again.');
      else if (status === 403)          setExportError("You don't have permission to export this report.");
      else if (status && status >= 500) setExportError('Server error generating the report. Try again in a moment.');
      else if (code === 'ECONNABORTED') setExportError('Request timed out. The server may be busy — try again.');
      else                              setExportError('Could not download the report. Check your connection and try again.');
      console.error('[ExportMenu]', err);
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => { setOpen((v) => !v); setExportError(''); }}
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg border transition-colors"
        style={{
          color: '#D9643A',
          borderColor: '#D9643A',
          background: open ? '#FAFAFA' : '#fff',
        }}
      >
        {downloading ? (
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <FileDown size={14} />
        )}
        {label}
        <ChevronDown size={13} style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s' }} />
      </button>

      {exportError && !open && (
        <div
          className="absolute right-0 mt-1 w-72 rounded-lg shadow-lg z-50"
          style={{ top: '100%', background: '#FFF5F5', border: '1px solid #FDEDEB' }}
        >
          <div className="flex items-start gap-2 px-3 py-2.5">
            <AlertCircle size={13} className="shrink-0 mt-0.5" style={{ color: '#C0392B' }} />
            <p className="flex-1 text-[12px] leading-relaxed" style={{ color: '#922B21' }}>{exportError}</p>
            <button onClick={() => setExportError('')} className="shrink-0" aria-label="Dismiss">
              <X size={12} style={{ color: '#922B21' }} />
            </button>
          </div>
        </div>
      )}

      {open && (
        <div
          ref={menuRef}
          className="absolute right-0 mt-1 w-56 rounded-xl overflow-hidden shadow-lg z-50"
          style={{ top: '100%', border: '1px solid #E9E9E9', background: '#fff' }}
        >
          {FORMATS.map((fmt, i) => {
            const Icon = fmt.icon;
            return (
              <button
                key={fmt.value}
                onClick={() => handleSelect(fmt)}
                disabled={downloading !== null}
                className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ borderBottom: i < FORMATS.length - 1 ? '1px solid #F0F0F0' : 'none' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#F9F9F9'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = ''; }}
              >
                <Icon size={16} style={{ color: '#D9643A' }} className="mt-0.5 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-[12px] font-semibold text-text-primary">{fmt.label}</span>
                  <span className="block text-[11px] text-text-hint leading-snug">{fmt.desc}</span>
                </span>
                {downloading === fmt.value && (
                  <span className="w-3 h-3 mt-1 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" style={{ color: '#D9643A' }} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
