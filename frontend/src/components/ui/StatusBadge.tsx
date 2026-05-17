import { UI_STATUS_BADGE_CONFIG, UI_STATUS_COMPACT_LABELS } from '../../constants/labels';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  compact?: boolean;
}

export default function StatusBadge({ 
  status, 
  size = 'md', 
  showDot = true,
  compact = false
}: StatusBadgeProps) {
  const displayName = compact ? UI_STATUS_COMPACT_LABELS[status] || status : status;
  const mapped = UI_STATUS_BADGE_CONFIG[status];
  const isKnown = Boolean(mapped);
  const dotTone = isKnown ? 'bg-[var(--line-strong)]' : 'bg-[var(--line)]';
  
  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3.5 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const compactPadding = compact ? 'px-2 py-0.5' : '';

  return (
    <div className={`
      inline-flex items-center rounded-md font-medium
      bg-[var(--soft)] text-[var(--ink)] ${sizeClasses[size]} ${compactPadding}
      border border-[var(--line)]
      transition-all duration-200
      whitespace-nowrap
    `}>
      {showDot && (
        <span className={`h-2.5 w-2.5 rounded-full mr-2.5 ${dotTone}`}></span>
      )}
      <span className="font-semibold">{displayName}</span>
    </div>
  );
}
