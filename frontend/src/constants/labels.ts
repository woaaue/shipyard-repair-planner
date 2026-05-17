import type { WorkCategory, WorkItemReviewStatus, WorkItemStatus } from '../services/workItems';
import type { RepairRequestStatus } from '../services/repairRequests';
import type { User } from '../context/AuthContext';

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
  NOT_SUBMITTED: 'Не отправлена на проверку',
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

export const ROLE_UI_LABELS: Record<User['role'], string> = {
  admin: 'Администратор',
  dispatcher: 'Диспетчер',
  operator: 'Оператор дока',
  master: 'Мастер участка',
  worker: 'Рабочий',
  client: 'Клиент',
};

export const UI_STATUS_COMPACT_LABELS: Record<string, string> = {
  'в ремонте': 'Ремонт',
  'в плавании': 'Плавание',
  ожидает: 'Ожидает',
  'в работе': 'В работе',
  запланирован: 'План',
  завершён: 'Готов',
  отменён: 'Отменён',
};

export const UI_STATUS_BADGE_CONFIG: Record<
  string,
  { dotColor: string; bgColor: string; textColor: string }
> = {
  'в ремонте': {
    dotColor: 'bg-orange-500',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-800',
  },
  ожидает: {
    dotColor: 'bg-red-500',
    bgColor: 'bg-red-50',
    textColor: 'text-red-800',
  },
  'в плавании': {
    dotColor: 'bg-green-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-800',
  },
  'в работе': {
    dotColor: 'bg-blue-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-800',
  },
  запланирован: {
    dotColor: 'bg-purple-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-800',
  },
  завершён: {
    dotColor: 'bg-gray-500',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-800',
  },
  отменён: {
    dotColor: 'bg-gray-400',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
  },
};
