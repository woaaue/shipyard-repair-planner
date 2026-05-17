import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function Card({ 
  children, 
  className = '', 
  title, 
  subtitle, 
  actions 
}: CardProps) {
  return (
    <div className={`rounded-xl border border-[var(--line)] bg-[rgba(255,255,255,0.97)] shadow-[var(--shadow)] overflow-visible ${className}`}>
      {(title || actions) && (
        <div className="border-b border-[var(--line)] px-6 py-4 flex items-center justify-between">
          <div>
            {title && <h3 className="text-lg font-semibold text-[var(--ink)]">{title}</h3>}
            {subtitle && <p className="text-sm text-[var(--muted)] mt-1">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
