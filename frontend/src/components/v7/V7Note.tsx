import type { ReactNode } from 'react';

interface V7NoteProps {
  title: string;
  children: ReactNode;
}

export default function V7Note({ title, children }: V7NoteProps) {
  return (
    <aside className="rounded-[7px] border border-[var(--line)] bg-[var(--soft)] p-3 text-[13px] leading-[1.42] text-[var(--ink)]">
      <strong className="mb-1 block">{title}</strong>
      {children}
    </aside>
  );
}
