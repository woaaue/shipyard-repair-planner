import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  change: number; // в процентах
  icon: string;
  color: 'green' | 'blue' | 'orange' | 'red';
  description: string;
}

export default function KPICard({ 
  title, 
  value, 
  change, 
  icon, 
  color, 
  description 
}: KPICardProps) {
  
  // Цвета в зависимости от типа
  const colorClasses = {
    green: 'bg-green-50 border-green-200',
    blue: 'bg-blue-50 border-blue-200',
    orange: 'bg-orange-50 border-orange-200',
    red: 'bg-red-50 border-red-200'
  };

  const iconClasses = {
    green: 'text-green-600 bg-green-100',
    blue: 'text-blue-600 bg-blue-100',
    orange: 'text-orange-600 bg-orange-100',
    red: 'text-red-600 bg-red-100'
  };

  const changeClasses = {
    green: 'text-green-700 bg-green-100',
    blue: 'text-blue-700 bg-blue-100',
    orange: 'text-orange-700 bg-orange-100',
    red: 'text-red-700 bg-red-100'
  };

  return (
    <div className={`card border-l-4 border-l-${color}-500 ${colorClasses[color]} transition-transform hover:scale-[1.02]`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mb-2">{value}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        
        <div className={`p-3 rounded-full ${iconClasses[color]}`}>
          <span className="text-xl">{icon}</span>
        </div>
      </div>
      
      <div className="mt-4 flex items-center">
        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${changeClasses[color]}`}>
          {change > 0 ? (
            <ArrowUp className="h-3 w-3 mr-1" />
          ) : change < 0 ? (
            <ArrowDown className="h-3 w-3 mr-1" />
          ) : (
            <Minus className="h-3 w-3 mr-1" />
          )}
          <span>{Math.abs(change)}%</span>
        </div>
        <span className="text-xs text-gray-500 ml-2">
          {change > 0 ? 'рост' : change < 0 ? 'снижение' : 'без изменений'} за месяц
        </span>
      </div>
    </div>
  );
}