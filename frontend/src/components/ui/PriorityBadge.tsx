import { AlertTriangle, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface PriorityBadgeProps {
  priority: 'низкий' | 'средний' | 'высокий' | 'критический';
  size?: 'sm' | 'md' | 'lg';
}

export default function PriorityBadge({ priority, size = 'md' }: PriorityBadgeProps) {
  
  const getPriorityConfig = (priority: string) => {
    const configs = {
      'низкий': {
        icon: CheckCircle,
        iconColor: 'text-[var(--muted)]'
      },
      'средний': {
        icon: Info,
        iconColor: 'text-[var(--muted)]'
      },
      'высокий': {
        icon: AlertCircle,
        iconColor: 'text-[var(--muted)]'
      },
      'критический': {
        icon: AlertTriangle,
        iconColor: 'text-[var(--muted)]'
      }
    };

    return configs[priority as keyof typeof configs] || configs.средний;
  };

  const { icon: Icon, iconColor } = getPriorityConfig(priority);
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconSize = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <div className={`
      inline-flex items-center gap-2 rounded-md font-medium
      bg-[var(--soft)] text-[var(--ink)] border-[var(--line)] ${sizeClasses[size]}
      border
      transition-all duration-200
      hover:bg-white
    `}>
      <Icon className={`${iconColor} ${iconSize[size]}`} />
      <span className="font-semibold capitalize">{priority}</span>
    </div>
  );
}
