import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import { getRepairs } from '../services/repairs';
import { getDocks } from '../services/docks';
import type { ExtendedRepair } from '../types/repair';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const STATUS_COLORS: Record<string, string> = {
  'в работе': 'bg-blue-500',
  запланирован: 'bg-purple-500',
  завершён: 'bg-green-500',
  отменён: 'bg-gray-400',
};

export default function Calendar() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDock, setSelectedDock] = useState<string>('');
  const [repairs, setRepairs] = useState<ExtendedRepair[]>([]);
  const [docks, setDocks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCalendarData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [repairsData, docksData] = await Promise.all([getRepairs(), getDocks()]);
        setRepairs(repairsData);
        setDocks(docksData.map((dock) => dock.name));
      } catch {
        setError('Failed to load calendar data.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadCalendarData();
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getRepairsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    let dayRepairs = repairs.filter((repair) => {
      const start = repair.startDate.slice(0, 10);
      const end = repair.endDate.slice(0, 10);
      return dateStr >= start && dateStr <= end;
    });

    if (user?.role === 'operator' && user.dock) {
      dayRepairs = dayRepairs.filter((repair) => repair.dock === user.dock);
    }

    if (selectedDock) {
      dayRepairs = dayRepairs.filter((repair) => repair.dock === selectedDock);
    }

    if (user?.role === 'client' && user.shipId) {
      dayRepairs = dayRepairs.filter((repair) => repair.shipId === user.shipId);
    }

    return dayRepairs;
  };

  const days = useMemo(() => {
    const calendarDays: Array<number | null> = [];
    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      calendarDays.push(i);
    }
    return calendarDays;
  }, [firstDay, daysInMonth]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Repair calendar</h1>

        <div className="flex items-center gap-4">
          <select
            value={selectedDock}
            onChange={(e) => setSelectedDock(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All docks</option>
            {docks.map((dock) => (
              <option key={dock} value={dock}>
                {dock}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

      <Card>
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>

          <h2 className="text-xl font-semibold">
            {MONTHS[month]} {year}
          </h2>

          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="text-gray-500">Loading...</div>
        ) : (
          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
            {DAYS.map((day) => (
              <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-600">
                {day}
              </div>
            ))}

            {days.map((day, index) => {
              const dayRepairs = day ? getRepairsForDay(day) : [];
              const isToday =
                day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

              return (
                <div key={index} className={`min-h-[100px] bg-white p-2 ${!day ? 'bg-gray-50' : ''}`}>
                  {day && (
                    <>
                      <div
                        className={`text-sm font-medium mb-1 ${
                          isToday
                            ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center'
                            : 'text-gray-700'
                        }`}
                      >
                        {day}
                      </div>

                      <div className="space-y-1">
                        {dayRepairs.slice(0, 2).map((repair) => (
                          <div
                            key={repair.id}
                            className={`text-xs p-1 rounded truncate text-white ${STATUS_COLORS[repair.status] || 'bg-gray-500'}`}
                            title={`${repair.shipName} - ${repair.status}`}
                          >
                            {repair.shipName}
                          </div>
                        ))}
                        {dayRepairs.length > 2 && <div className="text-xs text-gray-500">+{dayRepairs.length - 2} more</div>}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card>
        <h3 className="font-semibold mb-4">Status legend</h3>
        <div className="flex flex-wrap gap-4">
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${color}`} />
              <span className="text-sm text-gray-600">{status}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
