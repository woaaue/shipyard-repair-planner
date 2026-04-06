export interface AuditLogEntry {
  id: number;
  userId: string;
  userName: string;
  action: string;
  entity: 'ship' | 'repair' | 'user' | 'dock' | 'task';
  entityId: number;
  details?: string;
  timestamp: string;
}

export const mockAuditLog: AuditLogEntry[] = [
  {
    id: 1,
    userId: 'admin@dockplan.ru',
    userName: 'Иванов А.А.',
    action: 'Создал',
    entity: 'ship',
    entityId: 1,
    details: 'Добавлено судно "Анна Мария"',
    timestamp: '2025-11-01T09:00:00',
  },
  {
    id: 2,
    userId: 'operator.north@dockplan.ru',
    userName: 'Петров П.П.',
    action: 'Обновил',
    entity: 'repair',
    entityId: 1,
    details: 'Изменён статус ремонта на "в работе"',
    timestamp: '2025-11-15T10:30:00',
  },
  {
    id: 3,
    userId: 'admin@dockplan.ru',
    userName: 'Иванов А.А.',
    action: 'Создал',
    entity: 'user',
    entityId: 5,
    details: 'Добавлен пользователь "Мастеров М.М."',
    timestamp: '2025-11-20T14:00:00',
  },
  {
    id: 4,
    userId: 'master.north@dockplan.ru',
    userName: 'Мастеров М.М.',
    action: 'Завершил',
    entity: 'task',
    entityId: 1,
    details: 'Задача "Замена гребного винта" выполнена',
    timestamp: '2025-12-01T16:45:00',
  },
  {
    id: 5,
    userId: 'operator.north@dockplan.ru',
    userName: 'Петров П.П.',
    action: 'Зафиксировал',
    entity: 'dock',
    entityId: 1,
    details: 'Простой дока "Северный (200м)" - техобслуживание',
    timestamp: '2025-12-04T09:15:00',
  },
  {
    id: 6,
    userId: 'admin@dockplan.ru',
    userName: 'Иванов А.А.',
    action: 'Изменил',
    entity: 'repair',
    entityId: 5,
    details: 'Обновлён бюджет ремонта с 3500000 до 3800000',
    timestamp: '2025-12-05T11:30:00',
  },
];

export function getAuditLogByEntity(entity: string, entityId: number): AuditLogEntry[] {
  return mockAuditLog.filter(e => e.entity === entity && e.entityId === entityId);
}

export function getAuditLogByUser(userId: string): AuditLogEntry[] {
  return mockAuditLog.filter(e => e.userId === userId);
}

export function getRecentActions(limit = 10): AuditLogEntry[] {
  return [...mockAuditLog]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}