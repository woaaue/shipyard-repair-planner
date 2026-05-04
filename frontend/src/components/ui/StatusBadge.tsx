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
  const { dotColor, bgColor, textColor } = UI_STATUS_BADGE_CONFIG[status] || {
    dotColor: 'bg-gray-400',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
  };
  
  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3.5 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const compactPadding = compact ? 'px-2 py-0.5' : '';

  return (
    <div className={`
      inline-flex items-center rounded-full font-medium
      ${bgColor} ${textColor} ${sizeClasses[size]} ${compactPadding}
      border border-transparent
      transition-all duration-200
      whitespace-nowrap
    `}>
      {showDot && (
        <span className={`h-2.5 w-2.5 rounded-full mr-2.5 ${dotColor}`}></span>
      )}
      <span className="font-semibold">{displayName}</span>
    </div>
  );
}
