import { type ClassValue, clsx } from 'clsx';
import { api } from '@/lib/api';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Downloads a server-generated report file (PDF/Excel/CSV) by streaming it through the API client as a blob. */
export async function downloadReport(url: string, filenameFallback: string) {
  const res = await api.get(url, { responseType: 'blob' });
  const disposition = res.headers['content-disposition'] as string | undefined;
  const match = disposition?.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] ?? filenameFallback;

  const blobUrl = window.URL.createObjectURL(res.data as Blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export function riskColor(level: string): string {
  switch (level) {
    case 'CRITICAL': return 'text-red-700 bg-red-50 border-red-200';
    case 'HIGH':     return 'text-orange-700 bg-orange-50 border-orange-200';
    case 'MODERATE': return 'text-amber-700 bg-amber-50 border-amber-200';
    default:         return 'text-green-700 bg-green-50 border-green-200';
  }
}

export function riskDot(level: string): string {
  switch (level) {
    case 'CRITICAL': return 'bg-red-500';
    case 'HIGH':     return 'bg-orange-500';
    case 'MODERATE': return 'bg-amber-400';
    default:         return 'bg-green-500';
  }
}

export function severityColor(severity: string): string {
  switch (severity) {
    case 'CRITICAL': return 'text-red-700 bg-red-50';
    case 'WARNING':  return 'text-amber-700 bg-amber-50';
    default:         return 'text-blue-700 bg-blue-50';
  }
}
