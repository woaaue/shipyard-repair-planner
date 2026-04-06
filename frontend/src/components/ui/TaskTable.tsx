import { useState } from 'react';
import { CheckCircle, Clock } from 'lucide-react';
import Button from './Button';
import type { RepairTask } from '../../types/repair';

interface TaskTableProps {
  tasks: RepairTask[];
  onTaskComplete?: (taskId: number) => void;
  editable?: boolean;
}

export default function TaskTable({ tasks, onTaskComplete, editable = false }: TaskTableProps) {
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'worker'>('name');
  
  const sortedTasks = [...tasks].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'status') return (a.completed ? 1 : 0) - (b.completed ? 1 : 0);
    if (sortBy === 'worker') return a.worker.localeCompare(b.worker);
    return 0;
  });
  
  const completedCount = tasks.filter(t => t.completed).length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Выполнено: {completedCount} из {tasks.length} ({progress}%)
        </div>
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="name">По названию</option>
            <option value="status">По статусу</option>
            <option value="worker">По исполнителю</option>
          </select>
        </div>
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Задача</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Исполнитель</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Часы</th>
              {editable && <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Действия</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedTasks.map(task => (
              <tr key={task.id} className={task.completed ? 'bg-green-50' : ''}>
                <td className="px-4 py-3">
                  {task.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Clock className="h-5 w-5 text-yellow-500" />
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={task.completed ? 'line-through text-gray-400' : 'font-medium'}>
                    {task.name}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{task.worker}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={task.actualHours && task.actualHours > task.estimatedHours ? 'text-red-600' : ''}>
                    {task.actualHours || task.estimatedHours}ч
                  </span>
                </td>
                {editable && (
                  <td className="px-4 py-3 text-right">
                    {!task.completed && onTaskComplete && (
                      <Button size="sm" onClick={() => onTaskComplete(task.id)}>
                        Завершить
                      </Button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        
        {tasks.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            Нет задач
          </div>
        )}
      </div>
    </div>
  );
}