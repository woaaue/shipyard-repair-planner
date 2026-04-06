export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  userId?: string;
}

export const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'info',
    title: 'Ремонт начат',
    message: 'Ремонт судна "Анна Мария" в доке "Северный (200м)" начат',
    timestamp: '2025-12-07T10:30:00',
    read: false,
  },
  {
    id: '2',
    type: 'warning',
    title: 'Задержка ремонта',
    message: 'Ремонт судна "Урал" отстаёт от графика на 3 дня',
    timestamp: '2025-12-07T09:15:00',
    read: false,
  },
  {
    id: '3',
    type: 'success',
    title: 'Ремонт завершён',
    message: 'Ремонт судна "Балтика" успешно завершён',
    timestamp: '2025-12-06T16:45:00',
    read: true,
  },
  {
    id: '4',
    type: 'info',
    title: 'Новая заявка',
    message: 'Поступила новая заявка на ремонт от владельца судна "Волга"',
    timestamp: '2025-12-06T14:20:00',
    read: true,
  },
  {
    id: '5',
    type: 'error',
    title: 'Простой дока',
    message: 'Зафиксирован простой дока "Западный (180м)" - погодные условия',
    timestamp: '2025-12-06T08:00:00',
    read: true,
  },
  {
    id: '6',
    type: 'warning',
    title: 'Превышение бюджета',
    message: 'Ремонт "Сибирь" превысил плановый бюджет на 8%',
    timestamp: '2025-12-05T11:30:00',
    read: true,
  },
];

export function getUnreadCount(userId?: string): number {
  return mockNotifications.filter(n => !n.read && (!n.userId || n.userId === userId)).length;
}

export function getNotificationsByUser(userId?: string): Notification[] {
  return mockNotifications.filter(n => !n.userId || n.userId === userId);
}