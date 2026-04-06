export interface Ship {
  id: number;
  name: string;
  imo: string;
  type: 'Контейнеровоз' | 'Танкер' | 'Балкер' | 'Ролкер';
  status: 'в ремонте' | 'ожидает' | 'в плавании';
  buildYear: number;
  owner: string;
  lastRepairDate: string;
  nextRepairDate: string;
}

export interface Repair {
  id: number;
  shipId: number;
  shipName: string;
  dock: string;
  startDate: string;
  endDate: string;
  status: 'в работе' | 'завершён' | 'отменён' | 'запланирован';
  progress: number;
  budget: number;
  spent: number;
  manager: string;
}

export interface RepairTask {
  id: number;
  name: string;
  completed: boolean;
  estimatedHours: number;
  actualHours?: number;
  worker: string;
}

export type RepairType =
  | 'Доковый ремонт'
  | 'Текущий ремонт'
  | 'Средний ремонт'
  | 'Капитальный ремонт'
  | 'Аварийный ремонт';

export type Priority = 'низкий' | 'средний' | 'высокий' | 'критический';

export interface ExtendedRepair extends Repair {
  repairType: RepairType;
  priority: Priority;
  actualStartDate?: string;
  actualEndDate?: string;
  delayReason?: string;
  tasks: RepairTask[];
}

export interface KPI {
  title: string;
  value: string | number;
  change: number;
  icon: string;
  color: 'green' | 'blue' | 'orange' | 'red';
  description: string;
}
