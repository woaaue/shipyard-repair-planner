import type { ReactNode } from 'react';

interface V7PanelTitleProps {
  title: string;
  endpoint?: string;
  extra?: ReactNode;
}

export default function V7PanelTitle({ title, extra }: V7PanelTitleProps) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="m-0 text-base leading-[1.25] font-semibold text-[var(--ink)]">{title}</h2>
      <div className="flex items-center gap-3">
        {extra}
      </div>
    </div>
  );
}
