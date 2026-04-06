import type { RepairTask } from '../types/repair';

export const mockTasks: RepairTask[] = [
  { id: 1, name: 'Замена гребного винта', completed: true, estimatedHours: 120, actualHours: 110, worker: 'Слесарь Петров' },
  { id: 2, name: 'Ремонт корпуса', completed: true, estimatedHours: 200, actualHours: 180, worker: 'Сварщик Сидоров' },
  { id: 3, name: 'Обновление навигации', completed: false, estimatedHours: 80, actualHours: 40, worker: 'Электроник Иванов' },
  { id: 4, name: 'Покраска', completed: false, estimatedHours: 100, actualHours: 0, worker: 'Маляр Кузнецов' },
  { id: 5, name: 'Ремонт двигателя', completed: true, estimatedHours: 300, actualHours: 280, worker: 'Моторист Смирнов' },
  { id: 6, name: 'Замена трубопроводов', completed: false, estimatedHours: 150, actualHours: 90, worker: 'Слесарь Васильев' },
  { id: 7, name: 'Осмотр корпуса', completed: false, estimatedHours: 40, actualHours: 0, worker: 'Инженер Петров' },
  { id: 8, name: 'Чистка днища', completed: false, estimatedHours: 60, actualHours: 0, worker: 'Докер Иванов' },
  { id: 9, name: 'Ремонт крана', completed: true, estimatedHours: 80, actualHours: 75, worker: 'Механик Орлов' },
  { id: 10, name: 'Обслуживание систем', completed: true, estimatedHours: 120, actualHours: 110, worker: 'Техник Новиков' },
  { id: 11, name: 'Аварийный ремонт корпуса', completed: true, estimatedHours: 200, actualHours: 250, worker: 'Сварщик Семёнов' },
  { id: 12, name: 'Замена повреждённых узлов', completed: true, estimatedHours: 150, actualHours: 180, worker: 'Механик Павлов' },
];

export function getTasksByRepairId(repairId: number): RepairTask[] {
  const tasksPerRepair: Record<number, number[]> = {
    1: [1, 2, 3, 4],
    2: [5, 6],
    3: [7, 8],
    4: [9, 10],
    5: [11, 12],
  };
  
  const taskIds = tasksPerRepair[repairId] || [];
  return mockTasks.filter(t => taskIds.includes(t.id));
}