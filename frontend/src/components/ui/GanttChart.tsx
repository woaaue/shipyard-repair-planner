import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { mockExtendedRepairs } from '../../mock-data/data';
import { useAuth } from '../../context/AuthContext';
import Card from './Card';

interface GanttBar {
  id: number;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  status: string;
}

const MONTHS = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];

export default function GanttChart() {
  const { user } = useAuth();
  const [viewStart, setViewStart] = useState(new Date(2025, 10, 1));
  const [zoom, setZoom] = useState(1);
  
  const viewDays = 60 * zoom;
  
  const repairs = useMemo(() => {
    let data = mockExtendedRepairs;
    
    if (user?.role === 'operator' && user.dock) {
      data = data.filter(r => r.dock === user.dock);
    }
    
    return data;
  }, [user]);
  
  const ganttData: GanttBar[] = useMemo(() => {
    return repairs.map(r => ({
      id: r.id,
      name: r.shipName,
      start: new Date(r.startDate),
      end: new Date(r.endDate),
      progress: r.progress,
      status: r.status
    }));
  }, [repairs]);
  
  const days = Array.from({ length: viewDays }, (_, i) => {
    const d = new Date(viewStart);
    d.setDate(d.getDate() + i);
    return d;
  });
  
  const getBarPosition = (start: Date, end: Date) => {
    const startDiff = Math.floor((start.getTime() - viewStart.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (startDiff + duration < 0 || startDiff > viewDays) {
      return null;
    }
    
    return {
      left: Math.max(0, startDiff),
      width: Math.min(viewDays - Math.max(0, startDiff), duration)
    };
  };
  
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'в работе': return 'bg-blue-500';
      case 'завершён': return 'bg-green-500';
      case 'запланирован': return 'bg-purple-400';
      default: return 'bg-gray-400';
    }
  };
  
  const prevPeriod = () => setViewStart(d => {
    const newDate = new Date(d);
    newDate.setDate(newDate.getDate() - viewDays);
    return newDate;
  });
  
  const nextPeriod = () => setViewStart(d => {
    const newDate = new Date(d);
    newDate.setDate(newDate.getDate() + viewDays);
    return newDate;
  });
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={prevPeriod} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={nextPeriod} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronRight className="h-5 w-5" />
          </button>
          <span className="text-sm text-gray-600">
            {viewStart.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="p-2 hover:bg-gray-100 rounded-lg">
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-xs text-gray-500">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(2, z + 0.25))} className="p-2 hover:bg-gray-100 rounded-lg">
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <Card className="overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="flex border-b">
            <div className="w-48 flex-shrink-0 p-2 font-medium text-sm text-gray-600 border-r">Судно</div>
            <div className="flex-1 flex">
              {days.filter((_, i) => i % Math.ceil(7 / zoom) === 0).map((day, i) => (
                <div key={i} className="flex-1 text-center text-xs text-gray-500 p-1 border-r">
                  {day.getDate()} {MONTHS[day.getMonth()]}
                </div>
              ))}
            </div>
          </div>
          
          {ganttData.map(bar => {
            const pos = getBarPosition(bar.start, bar.end);
            if (!pos) return null;
            
            return (
              <div key={bar.id} className="flex border-b hover:bg-gray-50">
                <div className="w-48 flex-shrink-0 p-2 text-sm font-medium truncate border-r">
                  {bar.name}
                </div>
                <div className="flex-1 relative h-10">
                  <div 
                    className={`absolute h-6 top-2 rounded ${getStatusColor(bar.status)}`}
                    style={{
                      left: `${(pos.left / viewDays) * 100}%`,
                      width: `${(pos.width / viewDays) * 100}%`
                    }}
                  >
                    <div className="absolute inset-0 bg-white/30" style={{ width: `${bar.progress}%` }} />
                    <span className="absolute left-2 text-xs text-white font-medium">
                      {bar.progress}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          
          {ganttData.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              Нет данных для отображения
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}