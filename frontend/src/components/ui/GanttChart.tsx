import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { getRepairs } from '../../services/repairs';
import { useAuth } from '../../context/AuthContext';
import Card from './Card';
import type { ExtendedRepair } from '../../types/repair';

interface GanttBar {
  id: number;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  status: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function GanttChart() {
  const { user } = useAuth();
  const [viewStart, setViewStart] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [zoom, setZoom] = useState(1);
  const [repairs, setRepairs] = useState<ExtendedRepair[]>([]);

  const viewDays = Math.round(60 * zoom);

  useEffect(() => {
    const loadRepairs = async () => {
      try {
        const data = await getRepairs();
        setRepairs(data);
      } catch {
        setRepairs([]);
      }
    };

    void loadRepairs();
  }, []);

  const filteredRepairs = useMemo(() => {
    if (user?.role === 'operator' && user.dock) {
      return repairs.filter((repair) => repair.dock === user.dock);
    }
    if (user?.role === 'client' && user.shipId) {
      return repairs.filter((repair) => repair.shipId === user.shipId);
    }
    return repairs;
  }, [repairs, user]);

  const ganttData: GanttBar[] = useMemo(
    () =>
      filteredRepairs.map((repair) => ({
        id: repair.id,
        name: repair.shipName,
        start: new Date(repair.startDate),
        end: new Date(repair.endDate),
        progress: repair.progress,
        status: repair.status,
      })),
    [filteredRepairs]
  );

  const days = Array.from({ length: viewDays }, (_, i) => {
    const day = new Date(viewStart);
    day.setDate(day.getDate() + i);
    return day;
  });

  const getBarPosition = (start: Date, end: Date) => {
    const startDiff = Math.floor((start.getTime() - viewStart.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.max(1, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

    if (startDiff + duration < 0 || startDiff > viewDays) return null;

    return {
      left: Math.max(0, startDiff),
      width: Math.min(viewDays - Math.max(0, startDiff), duration),
    };
  };

  const getStatusColor = (status: string) => {
    if (status === 'в работе') return 'bg-blue-500';
    if (status === 'завершён') return 'bg-green-500';
    if (status === 'запланирован') return 'bg-purple-400';
    return 'bg-gray-400';
  };

  const prevPeriod = () => {
    setViewStart((date) => {
      const next = new Date(date);
      next.setDate(next.getDate() - viewDays);
      return next;
    });
  };

  const nextPeriod = () => {
    setViewStart((date) => {
      const next = new Date(date);
      next.setDate(next.getDate() + viewDays);
      return next;
    });
  };

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
            {viewStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setZoom((value) => Math.max(0.5, value - 0.25))} className="p-2 hover:bg-gray-100 rounded-lg">
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-xs text-gray-500">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((value) => Math.min(2, value + 0.25))} className="p-2 hover:bg-gray-100 rounded-lg">
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Card className="overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="flex border-b">
            <div className="w-48 flex-shrink-0 p-2 font-medium text-sm text-gray-600 border-r">Ship</div>
            <div className="flex-1 flex">
              {days.filter((_, i) => i % Math.max(1, Math.ceil(7 / zoom)) === 0).map((day, i) => (
                <div key={i} className="flex-1 text-center text-xs text-gray-500 p-1 border-r">
                  {day.getDate()} {MONTHS[day.getMonth()]}
                </div>
              ))}
            </div>
          </div>

          {ganttData.map((bar) => {
            const position = getBarPosition(bar.start, bar.end);
            if (!position) return null;

            return (
              <div key={bar.id} className="flex border-b hover:bg-gray-50">
                <div className="w-48 flex-shrink-0 p-2 text-sm font-medium truncate border-r">{bar.name}</div>
                <div className="flex-1 relative h-10">
                  <div
                    className={`absolute h-6 top-2 rounded ${getStatusColor(bar.status)}`}
                    style={{ left: `${(position.left / viewDays) * 100}%`, width: `${(position.width / viewDays) * 100}%` }}
                  >
                    <div className="absolute inset-0 bg-white/30" style={{ width: `${bar.progress}%` }} />
                    <span className="absolute left-2 text-xs text-white font-medium">{bar.progress}%</span>
                  </div>
                </div>
              </div>
            );
          })}

          {ganttData.length === 0 && <div className="p-8 text-center text-gray-500">No data to display</div>}
        </div>
      </Card>
    </div>
  );
}
