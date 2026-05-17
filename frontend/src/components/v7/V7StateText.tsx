interface V7StateTextProps {
  value: string;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Черновик',
  SUBMITTED: 'Подана',
  UNDER_REVIEW: 'На рассмотрении',
  APPROVED: 'Согласована',
  REJECTED: 'Отклонено',
  IN_PROGRESS: 'В работе',
  CLIENT_ACCEPTED: 'Принято клиентом',
  COMPLETED: 'Завершено',
  CANCELLED: 'Отменено',
  PENDING: 'Ожидает начала',
  NOT_REVIEWED: 'Не проверялась',
  PENDING_REVIEW: 'Ожидает проверки',
  ENABLED: 'Активен',
  DISABLED: 'Отключен',
  ACTIVE: 'Активен',
  INACTIVE: 'Неактивен',
  MAINTENANCE: 'На обслуживании',
};

function toDisplayStatus(value: string): string {
  const normalized = value.trim().toUpperCase();
  if (STATUS_LABELS[normalized]) {
    return STATUS_LABELS[normalized];
  }

  if (value.includes('_')) {
    return value
      .toLowerCase()
      .split('_')
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() + part.slice(1))
      .join(' ');
  }

  return value;
}

export default function V7StateText({ value }: V7StateTextProps) {
  return (
    <span className="whitespace-nowrap text-xs font-extrabold text-[var(--ink)]">
      {toDisplayStatus(value)}
    </span>
  );
}
