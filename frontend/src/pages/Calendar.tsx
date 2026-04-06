import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { mockExtendedRepairs } from '../mock-data/data';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';

const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const STATUS_COLORS: Record<string, string> = {
  'в работе': 'bg-blue-500',
  'запланирован': 'bg-purple-500',
  'завершён': 'bg-green-500',
  'отменён': 'bg-gray-400'
};

export default function Calendar() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDock, setSelectedDock] = useState<string>('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getRepairsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    let repairs = mockExtendedRepairs.filter(repair => {
      const start = repair.startDate.slice(0, 10);
      const end = repair.endDate.slice(0, 10);
      return dateStr >= start && dateStr <= end;
    });

    if (user?.role === 'operator' && user.dock) {
      repairs = repairs.filter(r => r.dock === user.dock);
    }

    if (selectedDock) {
      repairs = repairs.filter(r => r.dock === selectedDock);
    }

    return repairs;
  };

  const docks = [...new Set(mockExtendedRepairs.map(r => r.dock))];

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Календарь ремонтов</h1>
        
        <div className="flex items-center gap-4">
          <select
            value={selectedDock}
            onChange={(e) => setSelectedDock(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Все доки</option>
            {docks.map(dock => (
              <option key={dock} value={dock}>{dock}</option>
            ))}
          </select>
        </div>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <h2 className="text-xl font-semibold">
            {MONTHS[month]} {year}
          </h2>
          
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
          {DAYS.map(day => (
            <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-600">
              {day}
            </div>
          ))}
          
          {days.map((day, index) => {
            const repairs = day ? getRepairsForDay(day) : [];
            const isToday = day === new Date().getDate() && 
              month === new Date().getMonth() && 
              year === new Date().getFullYear();
            
            return (
              <div
                key={index}
                className={`min-h-[100px] bg-white p-2 ${!day ? 'bg-gray-50' : ''}`}
              >
                {day && (
                  <>
                    <div className={`text-sm font-medium mb-1 ${
                      isToday ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center' : 'text-gray-700'
                    }`}>
                      {day}
                    </div>
                    
                    <div className="space-y-1">
                      {repairs.slice(0, 2).map((repair, i) => (
                        <div
                          key={i}
                          className={`text-xs p-1 rounded truncate text-white ${STATUS_COLORS[repair.status] || 'bg-gray-500'}`}
                          title={`${repair.shipName} - ${repair.status}`}
                        >
                          {repair.shipName}
                        </div>
                      ))}
                      {repairs.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{repairs.length - 2} ещё
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold mb-4">Легенда статусов</h3>
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