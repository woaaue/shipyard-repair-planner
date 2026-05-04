import type { WorkCategory, WorkItemReviewStatus, WorkItemStatus } from '../services/workItems';

export const WORK_CATEGORY_LABELS: Record<WorkCategory, string> = {
  HULL: 'Корпус',
  MECHANICAL: 'Механика',
  ELECTRICAL: 'Электрика',
  PAINTING: 'Окраска',
  PIPING: 'Трубопроводы',
  VALVES: 'Арматура',
  PROPULSION: 'Движитель',
  STEEL: 'Металлоконструкции',
  TANKS: 'Танки/цистерны',
  SAFETY: 'Безопасность',
  OTHER: 'Другое',
};

export const WORK_REVIEW_STATUS_LABELS: Record<WorkItemReviewStatus, string> = {
  NOT_REVIEWED: 'Не проверялась',
  PENDING_REVIEW: 'Ожидает проверки',
  APPROVED: 'Принято',
  REJECTED: 'Возвращено',
};

export const WORK_STATUS_LABELS: Record<WorkItemStatus, string> = {
  PENDING: 'Ожидает начала',
  IN_PROGRESS: 'В работе',
  COMPLETED: 'Выполнено',
  CANCELLED: 'Отменено',
};
