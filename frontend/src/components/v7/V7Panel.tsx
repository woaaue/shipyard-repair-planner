import type { ReactNode } from 'react';

interface V7PanelProps {
  children: ReactNode;
  className?: string;
}

export default function V7Panel({ children, className = '' }: V7PanelProps) {
  return (
    <section
      className={`rounded-[8px] border border-[var(--line)] bg-[rgba(255,255,255,0.97)] p-4 shadow-[var(--shadow)] ${className}`}
    >
      {children}
    </section>
  );
}
