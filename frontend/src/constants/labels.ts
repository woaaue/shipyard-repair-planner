import type { WorkCategory, WorkItemReviewStatus, WorkItemStatus } from '../services/workItems';
import type { RepairRequestStatus } from '../services/repairRequests';

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

export const REPAIR_REQUEST_STATUS_LABELS: Record<RepairRequestStatus, string> = {
  DRAFT: 'Черновик',
  SUBMITTED: 'Подана',
  UNDER_REVIEW: 'На рассмотрении',
  APPROVED: 'Согласована',
  REJECTED: 'Отклонена',
  IN_PROGRESS: 'В работе',
  CLIENT_ACCEPTED: 'Принята клиентом',
  COMPLETED: 'Завершена',
  CANCELLED: 'Отменена',
};
