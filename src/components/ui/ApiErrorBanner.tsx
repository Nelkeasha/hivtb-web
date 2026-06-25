'use client';
import { AlertCircle, X } from 'lucide-react';

interface Props {
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export default function ApiErrorBanner({ message, onDismiss, className = '' }: Props) {
  return (
    <div
      className={`flex items-start gap-3 rounded-lg px-4 py-3 mb-4 ${className}`}
      style={{ background: 'rgba(209,44,31,0.06)', border: '1px solid #FDDCDA' }}
    >
      <AlertCircle size={15} className="shrink-0 mt-0.5" style={{ color: '#D12C1F' }} />
      <p className="flex-1 text-[13px] leading-relaxed" style={{ color: '#8B1A11' }}>{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 p-0.5 rounded transition-colors"
          style={{ color: '#8B1A11' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FDDCDA'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = ''; }}
          aria-label="Dismiss error"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}
