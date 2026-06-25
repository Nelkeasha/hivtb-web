import { cn } from '@/lib/utils';

interface Props {
  children: React.ReactNode;
  variant?: 'critical' | 'high' | 'moderate' | 'low' | 'info' | 'warning' | 'default';
  size?: 'sm' | 'md';
}

const styles: Record<string, string> = {
  critical: 'bg-red-50    text-[#C0392B] border border-red-100',
  high:     'bg-orange-50 text-[#E67E22] border border-orange-100',
  moderate: 'bg-amber-50  text-[#F39C12] border border-amber-100',
  low:      'bg-green-50  text-[#27AE60] border border-green-100',
  info:     'bg-blue-50   text-[#2980B9] border border-blue-100',
  warning:  'bg-amber-50  text-[#F39C12] border border-amber-100',
  default:  'bg-[#FAFAFA] text-text-secondary border border-[#E9E9E9]',
};

export default function Badge({ children, variant = 'default', size = 'sm' }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded',
        size === 'sm' ? 'text-[11px] px-2 py-[2px]' : 'text-xs px-2.5 py-1',
        styles[variant]
      )}
    >
      {children}
    </span>
  );
}

export function RiskBadge({ level }: { level: string }) {
  const variantMap: Record<string, 'critical' | 'high' | 'moderate' | 'low'> = {
    CRITICAL: 'critical', HIGH: 'high', MODERATE: 'moderate', LOW: 'low',
  };
  const labelMap: Record<string, string> = {
    CRITICAL: 'Critical', HIGH: 'High', MODERATE: 'Moderate', LOW: 'Low',
  };
  return (
    <Badge variant={variantMap[level] ?? 'default'}>
      {labelMap[level] ?? level}
    </Badge>
  );
}
