// Интерфейсы (типы данных)
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

export interface KPI {
  title: string;
  value: string | number;
  change: number; // процент изменения
  icon: string;
  color: 'green' | 'blue' | 'orange' | 'red';
  description: string;
}

// Моковые данные - суда
export const mockShips: Ship[] = [
  {
    id: 1,
    name: 'Анна Мария',
    imo: '9456789',
    type: 'Контейнеровоз',
    status: 'в ремонте',
    buildYear: 2018,
    owner: 'ООО "Морские перевозки"',
    lastRepairDate: '2025-09-15',  // ← Изменено
    nextRepairDate: '2026-03-20'   // ← Изменено
  },
  {
    id: 2,
    name: 'Волга',
    imo: '9234567',
    type: 'Танкер',
    status: 'ожидает',
    buildYear: 2015,
    owner: 'АО "Нефтетранс"',
    lastRepairDate: '2025-06-22',  // ← Изменено
    nextRepairDate: '2025-12-10'   // ← Изменено (скоро!)
  },
  {
    id: 3,
    name: 'Сибирь',
    imo: '9345678',
    type: 'Балкер',
    status: 'в плавании',
    buildYear: 2020,
    owner: 'ЗАО "Грузовые перевозки"',
    lastRepairDate: '2025-10-30',  // ← Изменено
    nextRepairDate: '2026-05-15'   // ← Изменено
  },
  {
    id: 4,
    name: 'Урал',
    imo: '9567890',
    type: 'Ролкер',
    status: 'в ремонте',
    buildYear: 2019,
    owner: 'ПАО "Дальневосточное пароходство"',
    lastRepairDate: '2025-07-10',  // ← Изменено
    nextRepairDate: '2025-12-25'   // ← Изменено (скоро!)
  },
  {
    id: 5,
    name: 'Балтика',
    imo: '9678901',
    type: 'Контейнеровоз',
    status: 'ожидает',
    buildYear: 2017,
    owner: 'ООО "Балтфлот"',
    lastRepairDate: '2025-08-18',  // ← Изменено
    nextRepairDate: '2026-01-05'   // ← Изменено
  }
];

// Моковые данные - ремонты
export const mockRepairs: Repair[] = [
  {
    id: 1,
    shipId: 1,
    shipName: 'Анна Мария',
    dock: 'Северный',
    startDate: '2026-03-01',
    endDate: '2026-04-15',
    status: 'в работе',
    progress: 65,
    budget: 5000000,
    spent: 3500000,
    manager: 'Иванов И.И.'
  },
  {
    id: 2,
    shipId: 4,
    shipName: 'Урал',
    dock: 'Западный',
    startDate: '2026-03-10',
    endDate: '2026-05-20',
    status: 'в работе',
    progress: 42,
    budget: 8000000,
    spent: 5200000,
    manager: 'Петров П.П.'
  },
  {
    id: 3,
    shipId: 2,
    shipName: 'Волга',
    dock: 'Восточный',
    startDate: '2026-04-01',
    endDate: '2026-06-30',
    status: 'запланирован',
    progress: 0,
    budget: 6000000,
    spent: 0,
    manager: 'Сидоров С.С.'
  },
  {
    id: 4,
    shipId: 5,
    shipName: 'Балтика',
    dock: 'Северный',
    startDate: '2026-02-15',
    endDate: '2026-03-30',
    status: 'завершён',
    progress: 100,
    budget: 4500000,
    spent: 4300000,
    manager: 'Кузнецов К.К.'
  }
];

// KPI данные для дашборда
export const mockKPIs: KPI[] = [
  {
    title: 'Всего судов',
    value: mockShips.length,
    change: 12,
    icon: '🚢',
    color: 'blue',
    description: 'Всего в управлении'
  },
  {
    title: 'В ремонте',
    value: mockShips.filter(ship => ship.status === 'в ремонте').length,
    change: 5,
    icon: '🔧',
    color: 'orange',
    description: 'Текущие ремонты'
  },
  {
    title: 'Ожидают ремонта',
    value: mockShips.filter(ship => ship.status === 'ожидает').length,
    change: -2,
    icon: '⏳',
    color: 'red',
    description: 'В очереди'
  },
  {
    title: 'Бюджет ремонтов',
    value: '18.5M ₽',
    change: 8,
    icon: '💰',
    color: 'green',
    description: 'Общий бюджет'
  }
];

// Дополнительные данные для ремонтов
export const repairTypes = [
  'Доковый ремонт',
  'Текущий ремонт', 
  'Средний ремонт',
  'Капитальный ремонт',
  'Аварийный ремонт'
] as const;

export let dockNames = [
  'Северный (200м)',
  'Западный (180м)', 
  'Восточный (150м)',
  'Южный (120м)',
  'Плавучий док'
] as const;

export function addDock(dockName: string) {
  dockNames = [...dockNames, dockName] as any;
}

// Расширяем интерфейс Repair
export interface ExtendedRepair extends Repair {
  repairType: typeof repairTypes[number];
  priority: 'низкий' | 'средний' | 'высокий' | 'критический';
  actualStartDate?: string;
  actualEndDate?: string;
  delayReason?: string;
  tasks: RepairTask[];
}

export interface RepairTask {
  id: number;
  name: string;
  completed: boolean;
  estimatedHours: number;
  actualHours?: number;
  worker: string;
}

// Расширенные моковые данные ремонтов
export const mockExtendedRepairs: ExtendedRepair[] = [
  {
    id: 1,
    shipId: 1,
    shipName: 'Анна Мария',
    dock: 'Северный (200м)',
    startDate: '2025-11-15',  // ← Текущий ремонт (начался недавно)
    endDate: '2025-12-30',    // ← Завершится в конце декабря
    actualStartDate: '2025-11-15',
    actualEndDate: undefined,
    status: 'в работе',
    progress: 65,
    budget: 5000000,
    spent: 3500000,
    manager: 'Иванов И.И.',
    repairType: 'Капитальный ремонт',
    priority: 'высокий',
    delayReason: undefined,
    tasks: [
      { id: 1, name: 'Замена гребного винта', completed: true, estimatedHours: 120, actualHours: 110, worker: 'Слесарь Петров' },
      { id: 2, name: 'Ремонт корпуса', completed: true, estimatedHours: 200, actualHours: 180, worker: 'Сварщик Сидоров' },
      { id: 3, name: 'Обновление навигации', completed: false, estimatedHours: 80, actualHours: 40, worker: 'Электроник Иванов' },
      { id: 4, name: 'Покраска', completed: false, estimatedHours: 100, actualHours: 0, worker: 'Маляр Кузнецов' }
    ]
  },
  {
    id: 2,
    shipId: 4,
    shipName: 'Урал',
    dock: 'Западный (180м)',
    startDate: '2025-12-01',  // ← Текущий ремонт (только начался)
    endDate: '2026-01-20',    // ← Завершится в январе
    actualStartDate: '2025-12-01',
    actualEndDate: undefined,
    status: 'в работе',
    progress: 42,
    budget: 8000000,
    spent: 5200000,
    manager: 'Петров П.П.',
    repairType: 'Средний ремонт',
    priority: 'средний',
    delayReason: 'Нехватка материалов',
    tasks: [
      { id: 1, name: 'Ремонт двигателя', completed: true, estimatedHours: 300, actualHours: 280, worker: 'Моторист Смирнов' },
      { id: 2, name: 'Замена трубопроводов', completed: false, estimatedHours: 150, actualHours: 90, worker: 'Слесарь Васильев' }
    ]
  },
  {
    id: 3,
    shipId: 2,
    shipName: 'Волга',
    dock: 'Восточный (150м)',
    startDate: '2025-12-10',  // ← Запланирован на 10 декабря
    endDate: '2026-01-30',    // ← Завершится в январе
    actualStartDate: undefined,
    actualEndDate: undefined,
    status: 'запланирован',
    progress: 0,
    budget: 6000000,
    spent: 0,
    manager: 'Сидоров С.С.',
    repairType: 'Доковый ремонт',
    priority: 'низкий',
    delayReason: undefined,
    tasks: [
      { id: 1, name: 'Осмотр корпуса', completed: false, estimatedHours: 40, actualHours: 0, worker: 'Инженер Петров' },
      { id: 2, name: 'Чистка днища', completed: false, estimatedHours: 60, actualHours: 0, worker: 'Докер Иванов' }
    ]
  },
  {
    id: 4,
    shipId: 5,
    shipName: 'Балтика',
    dock: 'Северный (200м)',
    startDate: '2025-10-15',  // ← Недавно завершённый ремонт
    endDate: '2025-11-30',
    actualStartDate: '2025-10-15',
    actualEndDate: '2025-11-28',
    status: 'завершён',
    progress: 100,
    budget: 4500000,
    spent: 4300000,
    manager: 'Кузнецов К.К.',
    repairType: 'Текущий ремонт',
    priority: 'средний',
    delayReason: undefined,
    tasks: [
      { id: 1, name: 'Ремонт крана', completed: true, estimatedHours: 80, actualHours: 75, worker: 'Механик Орлов' },
      { id: 2, name: 'Обслуживание систем', completed: true, estimatedHours: 120, actualHours: 110, worker: 'Техник Новиков' }
    ]
  },
  {
    id: 5,
    shipId: 3,
    shipName: 'Сибирь',
    dock: 'Плавучий док',
    startDate: '2025-09-10',  // ← Завершённый аварийный ремонт
    endDate: '2025-10-20',
    actualStartDate: '2025-09-10',
    actualEndDate: '2025-11-05',
    status: 'завершён',
    progress: 100,
    budget: 3500000,
    spent: 3800000,
    manager: 'Фёдоров Ф.Ф.',
    repairType: 'Аварийный ремонт',
    priority: 'критический',
    delayReason: 'Обнаружены скрытые дефекты',
    tasks: [
      { id: 1, name: 'Аварийный ремонт корпуса', completed: true, estimatedHours: 200, actualHours: 250, worker: 'Сварщик Семёнов' },
      { id: 2, name: 'Замена повреждённых узлов', completed: true, estimatedHours: 150, actualHours: 180, worker: 'Механик Павлов' }
    ]
  },
    {
    id: 6,
    shipId: 3,
    shipName: 'Сибирь',
    dock: 'Южный (120м)',
    startDate: '2026-01-15',  // ← Будущий ремонт
    endDate: '2026-03-01',
    actualStartDate: undefined,
    actualEndDate: undefined,
    status: 'запланирован',
    progress: 0,
    budget: 7500000,
    spent: 0,
    manager: 'Николаев Н.Н.',
    repairType: 'Капитальный ремонт',
    priority: 'высокий',
    delayReason: undefined,
    tasks: [
        { id: 1, name: 'Модернизация двигателя', completed: false, estimatedHours: 400, actualHours: 0, worker: 'Инженер Соколов' },
        { id: 2, name: 'Обновление систем', completed: false, estimatedHours: 250, actualHours: 0, worker: 'Техник Волков' }
    ]
  }
];

// Утилиты для работы с ремонтами
export function getRepairsByStatus(status: Repair['status']): ExtendedRepair[] {
  return mockExtendedRepairs.filter(repair => repair.status === status);
}

export function getRepairsByDock(dock: string): ExtendedRepair[] {
  return mockExtendedRepairs.filter(repair => repair.dock === dock);
}

export function getOverdueRepairs(): ExtendedRepair[] {
  const today = new Date('2025-12-07'); // Фиксируем сегодняшнюю дату
  return mockExtendedRepairs.filter(repair => {
    if (repair.status === 'в работе' && repair.actualEndDate === undefined) {
      const endDate = new Date(repair.endDate);
      return endDate < today;
    }
    return false;
  });
}

export function calculateRepairEfficiency(repair: ExtendedRepair): number {
  if (repair.spent === 0) return 0;
  const plannedHours = repair.tasks.reduce((sum, task) => sum + task.estimatedHours, 0);
  const actualHours = repair.tasks.reduce((sum, task) => sum + (task.actualHours || 0), 0);
  return plannedHours > 0 ? Math.round((plannedHours / actualHours) * 100) : 0;
}

// Утилитарные функции
export function getActiveRepairs() {
  return mockRepairs.filter(repair => repair.status === 'в работе');
}

export function getUpcomingRepairs() {
  return mockRepairs.filter(repair => repair.status === 'запланирован');
}

export function calculateTotalBudget() {
  return mockRepairs.reduce((sum, repair) => sum + repair.budget, 0);
}

export function calculateTotalSpent() {
  return mockRepairs.reduce((sum, repair) => sum + repair.spent, 0);
}

// Добавление судна
let nextShipId = mockShips.length + 1;

export function addShip(shipData: Omit<Ship, 'id'>): Ship {
  const newShip: Ship = {
    ...shipData,
    id: nextShipId++
  };
  mockShips.push(newShip);
  return newShip;
}

// Добавление ремонта
let nextRepairId = mockExtendedRepairs.length + 1;

export function addRepair(repairData: Omit<ExtendedRepair, 'id'>): ExtendedRepair {
  const newRepair: ExtendedRepair = {
    ...repairData,
    id: nextRepairId++
  };
  mockExtendedRepairs.push(newRepair);
  return newRepair;
}

export function updateRepairStatus(repairId: number, newStatus: string) {
  const repair = mockExtendedRepairs.find(r => r.id === repairId);
  if (repair) {
    repair.status = newStatus as any;
  }
}