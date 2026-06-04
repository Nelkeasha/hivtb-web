import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  loading?: boolean;
}

const variants: Record<string, string> = {
  primary:   'bg-primary hover:bg-primary-dark text-white shadow-sm',
  secondary: 'bg-white hover:bg-background text-primary border border-primary',
  ghost:     'bg-transparent hover:bg-background text-text-secondary',
  danger:    'bg-[#C0392B] hover:bg-[#A01E1E] text-white shadow-sm',
};

const sizes: Record<string, string> = {
  sm: 'text-[12px] px-3 py-1.5 gap-1.5',
  md: 'text-[13px] px-4 py-2 gap-2',
  lg: 'text-[13px] px-5 py-2.5 gap-2',
};

const spinnerSizes: Record<string, string> = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-4 h-4',
};

const iconSizes: Record<string, number> = {
  sm: 13,
  md: 15,
  lg: 15,
};

export default function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading,
  children,
  className,
  disabled,
  ...props
}: Props) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-semibold rounded-lg transition-colors cursor-pointer',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {loading ? (
        <span
          className={cn(
            'border-2 border-current border-t-transparent rounded-full animate-spin',
            spinnerSizes[size],
          )}
        />
      ) : Icon ? (
        <Icon size={iconSizes[size]} />
      ) : null}
      {children}
    </button>
  );
}
