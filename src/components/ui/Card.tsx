import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function Card({ children, className, title, subtitle, action }: CardProps) {
  const hasHeader = title || action;
  return (
    <div className={cn('bg-white rounded-xl', className)} style={{ border: '1px solid #E9E9E9' }}>
      {hasHeader && (
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #F0F0F0' }}>
          <div>
            {title && (
              <h3 className="text-[13px] font-semibold text-text-primary tracking-tight">{title}</h3>
            )}
            {subtitle && (
              <p className="text-[11px] text-text-hint mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={cn('px-6 pb-6', hasHeader ? 'pt-5' : 'pt-6')}>
        {children}
      </div>
    </div>
  );
}

export function CardSimple({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn('bg-white rounded-xl p-6', className)}
      style={{ border: '1px solid #E9E9E9' }}
    >
      {children}
    </div>
  );
}
