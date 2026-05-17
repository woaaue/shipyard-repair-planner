import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getRepairs } from '../services/repairs';
import { getDocks } from '../services/docks';
import type { ExtendedRepair } from '../types/repair';
import V7PageHeader from '../components/v7/V7PageHeader';
import V7Panel from '../components/v7/V7Panel';
import V7PanelTitle from '../components/v7/V7PanelTitle';
import Modal from '../components/ui/Modal';
import { formatDateRangeRu, normalizeDateOnly } from '../utils/repairDates';

const MONTHS = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const STATUS_LEGEND = [
  { key: 'in_progress', label: 'в работе', marker: 'bg-amber-500', surface: 'bg-amber-50', border: 'border-amber-200' },
  { key: 'planned', label: 'запланирован', marker: 'bg-sky-500', surface: 'bg-sky-50', border: 'border-sky-200' },
  { key: 'completed', label: 'завершён', marker: 'bg-emerald-500', surface: 'bg-emerald-50', border: 'border-emerald-200' },
  { key: 'cancelled', label: 'отменён', marker: 'bg-slate-400', surface: 'bg-slate-100', border: 'border-slate-300' },
] as const;

function resolveStatusTone(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes('работ')) return STATUS_LEGEND[0];
  if (normalized.includes('план')) return STATUS_LEGEND[1];
  if (normalized.includes('заверш') || normalized.includes('выполн')) return STATUS_LEGEND[2];
  if (normalized.includes('отмен')) return STATUS_LEGEND[3];
  return { key: 'default', label: status, marker: 'bg-slate-400', surface: 'bg-slate-50', border: 'border-slate-200' };
}

export default function Calendar() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDock, setSelectedDock] = useState<string>('');
  const [repairs, setRepairs] = useState<ExtendedRepair[]>([]);
  const [docks, setDocks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedDayRepairs, setSelectedDayRepairs] = useState<ExtendedRepair[]>([]);

  useEffect(() => {
    const loadCalendarData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [repairsData, docksData] = await Promise.all([getRepairs(), getDocks()]);
        setRepairs(repairsData);
        setDocks(docksData.map((dock) => dock.name));
      } catch {
        setError('Не удалось загрузить календарь ремонтов.');
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

  const openDayDetails = (day: number, dayRepairs: ExtendedRepair[]) => {
    setSelectedDay(day);
    setSelectedDayRepairs(dayRepairs);
  };

  const closeDayDetails = () => {
    setSelectedDay(null);
    setSelectedDayRepairs([]);
  };

  const getRepairsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    let dayRepairs = repairs.filter((repair) => {
      const start = normalizeDateOnly(repair.startDate);
      const end = normalizeDateOnly(repair.endDate);
      if (!start && !end) return false;
      const rangeStart = start ?? end!;
      const rangeEnd = end ?? start!;
      return dateStr >= rangeStart && dateStr <= rangeEnd;
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
      <V7PageHeader
        title="Календарь ремонтов"
        description="Календарное представление графика ремонтов."
        actions={
          <select
            value={selectedDock}
            onChange={(e) => setSelectedDock(e.target.value)}
            className="px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
          >
            <option value="">Все доки</option>
            {docks.map((dock) => (
              <option key={dock} value={dock}>
                {dock}
              </option>
            ))}
          </select>
        }
      />

      {error && <div className="px-4 py-3 rounded-lg border bg-[var(--danger-bg)] border-[var(--danger-line)] text-[var(--danger-ink)]">{error}</div>}

      <V7Panel>
        <V7PanelTitle title="Календарь" />
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="p-2 hover:bg-[var(--soft)] rounded-lg transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>

          <h2 className="text-xl font-semibold">
            {MONTHS[month]} {year}
          </h2>

          <button onClick={nextMonth} className="p-2 hover:bg-[var(--soft)] rounded-lg transition-colors">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="text-[var(--muted)]">Загрузка...</div>
        ) : (
          <div className="grid grid-cols-7 gap-px bg-[var(--line)] rounded-lg overflow-hidden">
            {DAYS.map((day) => (
              <div key={day} className="bg-[var(--soft)] p-2 text-center text-sm font-medium text-[var(--muted)]">
                {day}
              </div>
            ))}

            {days.map((day, index) => {
              const dayRepairs = day ? getRepairsForDay(day) : [];
              const isToday =
                day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

              return (
                <div
                  key={index}
                  className={`min-h-[100px] bg-white p-2 ${!day ? 'bg-[var(--soft)]' : 'cursor-pointer hover:bg-[var(--soft)] transition-colors'}`}
                  onClick={day ? () => openDayDetails(day, dayRepairs) : undefined}
                  onKeyDown={
                    day
                      ? (event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            openDayDetails(day, dayRepairs);
                          }
                        }
                      : undefined
                  }
                  role={day ? 'button' : undefined}
                  tabIndex={day ? 0 : undefined}
                >
                  {day && (
                    <>
                      <div
                        className={`text-sm font-medium mb-1 ${
                          isToday
                            ? 'bg-[var(--blue)] text-white rounded-full w-6 h-6 flex items-center justify-center'
                            : 'text-[var(--ink)]'
                        }`}
                      >
                        {day}
                      </div>

                      <div className="space-y-1">
                        {dayRepairs.slice(0, 2).map((repair) => (
                          (() => {
                            const tone = resolveStatusTone(repair.status);
                            return (
                              <div
                                key={repair.id}
                                className={`text-xs p-1 rounded-md truncate border ${tone.border} ${tone.surface} text-[var(--ink)]`}
                                title={`${repair.shipName} - ${repair.status}`}
                              >
                                {repair.shipName}
                              </div>
                            );
                          })()
                        ))}
                        {dayRepairs.length > 2 && <div className="text-xs text-[var(--muted)]">+{dayRepairs.length - 2} еще</div>}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </V7Panel>

      <V7Panel>
        <V7PanelTitle title="Легенда статусов" />
        <div className="flex flex-wrap gap-4">
          {STATUS_LEGEND.map((item) => (
            <div key={item.key} className="flex items-center gap-2 rounded-md border border-[var(--line)] bg-white px-2 py-1.5">
              <div className={`w-2.5 h-2.5 rounded-sm ${item.marker}`} />
              <span className="text-sm text-[var(--ink)]">{item.label}</span>
            </div>
          ))}
        </div>
      </V7Panel>

      <Modal
        isOpen={selectedDay !== null}
        onClose={closeDayDetails}
        title={selectedDay === null ? 'Ремонты на дату' : `Ремонты на ${selectedDay} ${MONTHS[month]} ${year}`}
        size="lg"
      >
        {selectedDayRepairs.length === 0 ? (
          <div className="text-sm text-[var(--muted)]">На эту дату активных ремонтов нет.</div>
        ) : (
          <div className="space-y-3">
            {selectedDayRepairs.map((repair) => {
              const tone = resolveStatusTone(repair.status);
              return (
                <div key={repair.id} className="rounded-lg border border-[var(--line)] bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-[var(--ink)]">{repair.shipName}</div>
                      <div className="text-xs text-[var(--muted)] mt-1">
                        Док: {repair.dock || 'Не назначен'} · {formatDateRangeRu(repair.startDate, repair.endDate)}
                      </div>
                      <div className="text-xs text-[var(--muted)] mt-1">
                        Ответственный: {repair.manager || 'Не назначен'}
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-md border px-2 py-1 text-xs ${tone.border} ${tone.surface} text-[var(--ink)]`}>
                      {repair.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
}

