import type { ReactNode } from 'react';

interface V7PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export default function V7PageHeader({ title, description, actions }: V7PageHeaderProps) {
  return (
    <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-5">
      <div>
        <h1 className="m-0 text-[28px] leading-[1.12] font-extrabold text-[var(--ink)]">{title}</h1>
        {description ? (
          <p className="mt-2 mb-0 text-sm leading-[1.45] text-[var(--muted)]">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap justify-start gap-2 md:justify-end">{actions}</div> : null}
    </div>
  );
}
