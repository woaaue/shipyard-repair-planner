export interface Downtime {
  id: number;
  dock: string;
  reason: string;
  startDate: string;
  endDate?: string;
  expectedEndDate?: string;
  notes?: string;
}

export const mockDowntimes: Downtime[] = [
  {
    id: 1,
    dock: 'Западный (180м)',
    reason: 'Погодные условия',
    startDate: '2025-12-06T08:00:00',
    expectedEndDate: '2025-12-06T18:00:00',
    notes: 'Сильный ветер, постановка судна невозможна',
  },
  {
    id: 2,
    dock: 'Северный (200м)',
    reason: 'Техническая поломка',
    startDate: '2025-12-05T14:00:00',
    endDate: '2025-12-05T16:30:00',
    notes: 'Неисправность кранового оборудования',
  },
  {
    id: 3,
    dock: 'Южный (120м)',
    reason: 'Плановое техническое обслуживание',
    startDate: '2025-12-04T09:00:00',
    endDate: '2025-12-04T17:00:00',
    notes: 'Ежемесячное ТО',
  },
];

export function getDowntimesByDock(dock: string): Downtime[] {
  return mockDowntimes.filter(d => d.dock === dock);
}

export function getActiveDowntimes(): Downtime[] {
  return mockDowntimes.filter(d => !d.endDate);
}