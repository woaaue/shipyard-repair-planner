interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  compact?: boolean; // Новый пропс для компактного отображения
}

export default function StatusBadge({ 
  status, 
  size = 'md', 
  showDot = true,
  compact = false
}: StatusBadgeProps) {
  
  // Компактные названия статусов для мобилок
  const compactNames: Record<string, string> = {
    'в ремонте': 'Ремонт',
    'в плавании': 'Плавание',
    'ожидает': 'Ожидает',
    'в работе': 'В работе',
    'запланирован': 'План',
    'завершён': 'Готов',
    'отменён': 'Отменён'
  };

  // Выбираем отображаемое имя
  const displayName = compact ? compactNames[status] || status : status;

  // Полная конфигурация для каждого статуса
  const getStatusConfig = (status: string) => {
    const configs: Record<string, { dotColor: string, bgColor: string, textColor: string }> = {
      'в ремонте': {
        dotColor: 'bg-orange-500',
        bgColor: 'bg-orange-50',
        textColor: 'text-orange-800'
      },
      'ожидает': {
        dotColor: 'bg-red-500',
        bgColor: 'bg-red-50',
        textColor: 'text-red-800'
      },
      'в плавании': {
        dotColor: 'bg-green-500',
        bgColor: 'bg-green-50',
        textColor: 'text-green-800'
      },
      'в работе': {
        dotColor: 'bg-blue-500',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-800'
      },
      'запланирован': {
        dotColor: 'bg-purple-500',
        bgColor: 'bg-purple-50',
        textColor: 'text-purple-800'
      },
      'завершён': {
        dotColor: 'bg-gray-500',
        bgColor: 'bg-gray-50',
        textColor: 'text-gray-800'
      },
      'отменён': {
        dotColor: 'bg-gray-400',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-700'
      }
    };

    return configs[status] || {
      dotColor: 'bg-gray-400',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-700'
    };
  };

  const { dotColor, bgColor, textColor } = getStatusConfig(status);
  
  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3.5 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  // Для компактного режима уменьшаем отступы
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