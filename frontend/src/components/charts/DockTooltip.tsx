import { X } from 'lucide-react';
import { useState } from 'react';
import type { DockData } from '../../hooks/useDockSelection';

interface DockTooltipProps {
  data: DockData;
  onClose: () => void;
}

export default function DockTooltip({ data, onClose }: DockTooltipProps) {
  const [isClosing, setIsClosing] = useState(false);
  
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };
  
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      default: return '#10b981';
    }
  };
  
  return (
    <div className={`border-t border-gray-200 pt-4 mt-4 ${
      isClosing ? 'animate-slide-up' : 'animate-slide-down'
    }`}>
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-bold text-lg text-gray-800">{data.dockOriginal}</h4>
        <button 
          onClick={handleClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Загрузка:</span>
          <span className="font-bold" style={{ color: getStatusColor(data.status) }}>
            {data.загрузка}%
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Ремонтов сейчас:</span>
          <span className="font-medium">{data.current} из 3</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Вместимость:</span>
          <span className="font-medium">{data.capacity}м</span>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-600">
            {data.status === 'high' ? 'Высокая загрузка - планируйте ремонты в других доках' :
             data.status === 'medium' ? 'Средняя загрузка - доступны дополнительные мощности' :
             'Низкая загрузка - док готов к новым ремонтам'}
          </div>
        </div>
      </div>
    </div>
  );
}
