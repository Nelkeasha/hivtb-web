'use client';
import { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'teal' | 'coral' | 'green' | 'red' | 'amber' | 'blue' | 'orange' | 'purple';
  subtitle?: string;
  trend?: { value: number; label: string };
}

const palette: Record<string, { accent: string; iconBg: string; iconColor: string }> = {
  teal:   { accent: '#E64B2E', iconBg: 'rgba(230,75,46,0.09)',  iconColor: '#E64B2E' },
  green:  { accent: '#2E7D32', iconBg: 'rgba(46,125,50,0.10)',  iconColor: '#2E7D32' },
  red:    { accent: '#C0392B', iconBg: 'rgba(192,57,43,0.09)',  iconColor: '#C0392B' },
  amber:  { accent: '#B26A00', iconBg: 'rgba(178,106,0,0.09)',  iconColor: '#B26A00' },
  coral:  { accent: '#E64B2E', iconBg: 'rgba(230,75,46,0.09)',  iconColor: '#E64B2E' },
  blue:   { accent: '#1565C0', iconBg: 'rgba(21,101,192,0.09)', iconColor: '#1565C0' },
  orange: { accent: '#E67E22', iconBg: 'rgba(230,126,34,0.09)', iconColor: '#E67E22' },
  purple: { accent: '#6B3FA0', iconBg: 'rgba(107,63,160,0.09)', iconColor: '#6B3FA0' },
};

export default function StatCard({ title, value, icon: Icon, color = 'teal', subtitle, trend }: Props) {
  const { accent, iconBg, iconColor } = palette[color] ?? palette.teal;
  const hasFooter = subtitle || trend;

  return (
    <div
      className="bg-white rounded-xl overflow-hidden transition-shadow hover:shadow-sm"
      style={{ border: '1px solid #E9E9E9', borderLeft: `3px solid ${accent}` }}
    >
      <div className="p-5">

        {/* Title + icon */}
        <div className="flex items-start justify-between mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-text-hint leading-tight pr-2">
            {title}
          </p>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 -mt-0.5"
            style={{ background: iconBg }}
          >
            <Icon size={14} style={{ color: iconColor }} />
          </div>
        </div>

        {/* Value */}
        <p
          className="data-num text-[26px] font-semibold leading-none"
          style={{ color: accent }}
        >
          {value}
        </p>

        {/* Footer */}
        {hasFooter && (
          <div className="flex items-center justify-between mt-2">
            {subtitle && (
              <p className="text-[12px] text-text-hint truncate">{subtitle}</p>
            )}
            {trend && (
              <span
                className="data-num text-[11px] font-semibold ml-auto shrink-0"
                style={{ color: trend.value >= 0 ? '#27AE60' : '#C0392B' }}
              >
                {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
