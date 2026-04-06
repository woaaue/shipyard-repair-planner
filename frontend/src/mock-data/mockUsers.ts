export let mockUsers = [
  {
    email: 'admin@dockplan.ru',
    password: '123456',
    role: 'admin' as const,
    fullName: 'Иванов А.А.',
    avatar: '👨‍💼'
  },
  {
    email: 'dispatcher@dockplan.ru',
    password: '123456',
    role: 'dispatcher' as const,
    fullName: 'Диспетчеров Д.Д.',
    avatar: '📋'
  },
  {
    email: 'operator.north@dockplan.ru',
    password: '123456',
    role: 'operator' as const,
    fullName: 'Петров П.П.',
    dock: 'Северный (200м)',
    avatar: '👷'
  },
  {
    email: 'operator.west@dockplan.ru',
    password: '123456',
    role: 'operator' as const,
    fullName: 'Сидоров С.С.',
    dock: 'Западный (180м)',
    avatar: '👷'
  },
  {
    email: 'client.annamaria@dockplan.ru',
    password: '123456',
    role: 'client' as const,
    fullName: 'Кузнецов К.К.',
    shipId: 1,
    avatar: '👨‍✈️'
  },
  {
    email: 'master.north@dockplan.ru',
    password: '123456',
    role: 'master' as const,
    fullName: 'Мастеров М.М.',
    dock: 'Северный (200м)',
    avatar: '👨‍🔧'
  },
  {
    email: 'worker.one@dockplan.ru',
    password: '123456',
    role: 'worker' as const,
    fullName: 'Работников Р.Р.',
    dock: 'Северный (200м)',
    avatar: '🔧'
  }
];

type UserRole = 'admin' | 'dispatcher' | 'operator' | 'master' | 'worker' | 'client';

type UserRecord = {
  email: string;
  password: string;
  role: UserRole;
  fullName: string;
  dock?: string;
  shipId?: number;
  avatar?: string;
};

export function addUser(userData: UserRecord) {
  mockUsers.push(userData as typeof mockUsers[number]);
}