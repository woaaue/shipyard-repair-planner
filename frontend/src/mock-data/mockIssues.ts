export interface Issue {
  id: number;
  repairId: number;
  type: string;
  description: string;
  impact: 'минимальный' | 'средний' | 'значительный' | 'критический';
  status: 'открыта' | 'в работе' | 'решена';
  reportedBy: string;
  reportedAt: string;
  resolvedAt?: string;
}

export const mockIssues: Issue[] = [
  {
    id: 1,
    repairId: 1,
    type: 'Обнаружен дефект',
    description: 'При осмотре обнаружена коррозия на корпусе в районе 5-го отсека',
    impact: 'значительный',
    status: 'в работе',
    reportedBy: 'Инженер Петров',
    reportedAt: '2025-12-05T11:00:00',
  },
  {
    id: 2,
    repairId: 2,
    type: 'Нехватка материалов',
    description: 'Закончились запасные части для двигателя MAN B&W',
    impact: 'средний',
    status: 'решена',
    reportedBy: 'Мастер Сидоров',
    reportedAt: '2025-12-04T09:30:00',
    resolvedAt: '2025-12-05T14:00:00',
  },
  {
    id: 3,
    repairId: 2,
    type: 'Задержка работ',
    description: 'Задержка из-за отсутствия квалифицированного персонала',
    impact: 'критический',
    status: 'открыта',
    reportedBy: 'Мастер Сидоров',
    reportedAt: '2025-12-06T16:00:00',
  },
  {
    id: 4,
    repairId: 5,
    type: 'Техническая неисправность',
    description: 'Обнаружена течь в трубопроводе высокого давления',
    impact: 'средний',
    status: 'решена',
    reportedBy: 'Механик Семёнов',
    reportedAt: '2025-12-03T10:00:00',
    resolvedAt: '2025-12-04T15:00:00',
  },
];

export function getIssuesByRepair(repairId: number): Issue[] {
  return mockIssues.filter(i => i.repairId === repairId);
}

export function getOpenIssuesCount(): number {
  return mockIssues.filter(i => i.status !== 'решена').length;
}