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
        iconColor: 'text-green-500',
        bgColor: 'bg-green-50',
        textColor: 'text-green-800',
        borderColor: 'border-green-200'
      },
      'средний': {
        icon: Info,
        iconColor: 'text-blue-500',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-800',
        borderColor: 'border-blue-200'
      },
      'высокий': {
        icon: AlertCircle,
        iconColor: 'text-orange-500',
        bgColor: 'bg-orange-50',
        textColor: 'text-orange-800',
        borderColor: 'border-orange-200'
      },
      'критический': {
        icon: AlertTriangle,
        iconColor: 'text-red-500',
        bgColor: 'bg-red-50',
        textColor: 'text-red-800',
        borderColor: 'border-red-200'
      }
    };

    return configs[priority as keyof typeof configs] || configs.средний;
  };

  const { icon: Icon, iconColor, bgColor, textColor, borderColor } = getPriorityConfig(priority);
  
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
      inline-flex items-center gap-2 rounded-full font-medium
      ${bgColor} ${textColor} ${borderColor} ${sizeClasses[size]}
      border
      transition-all duration-200
      hover:scale-[1.02] hover:shadow-sm
    `}>
      <Icon className={`${iconColor} ${iconSize[size]}`} />
      <span className="font-semibold capitalize">{priority}</span>
    </div>
  );
}