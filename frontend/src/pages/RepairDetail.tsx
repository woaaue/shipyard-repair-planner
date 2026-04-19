import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Ship, DollarSign, CheckCircle, Clock, Calendar, Flag } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import PriorityBadge from '../components/ui/PriorityBadge';
import ProgressCircle from '../components/ui/ProgressCircle';
import Modal from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { getRepair, updateRepairStatus, type BackendRepairStatus } from '../services/repairs';
import { getRepairRequest } from '../services/repairRequests';
import { getWorkItems } from '../services/workItems';
import type { ExtendedRepair } from '../types/repair';

const PRIORITIES = ['низкий', 'средний', 'высокий', 'критический'] as const;

function statusToBackend(status: ExtendedRepair['status']): BackendRepairStatus {
  if (status === 'в работе') return 'IN_PROGRESS';
  if (status === 'завершён') return 'COMPLETED';
  if (status === 'отменён') return 'CANCELLED';
  return 'SCHEDULED';
}

function toDate(input?: string | null): string {
  if (!input) return new Date().toISOString().slice(0, 10);
  return input.slice(0, 10);
}

export default function RepairDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [repair, setRepair] = useState<ExtendedRepair | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [newPriority, setNewPriority] = useState<string>('средний');

  const repairId = Number(id || '0');

  const loadRepair = async () => {
    if (!repairId) {
      setRepair(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const baseRepair = await getRepair(repairId);
      const [request, workItems] = await Promise.all([
        getRepairRequest(baseRepair.shipId).catch(() => null),
        getWorkItems({ repairId }),
      ]);

      const tasks = workItems.map((item) => ({
        id: item.id,
        name: item.name,
        completed: item.status === 'COMPLETED',
        estimatedHours: item.estimatedHours,
        actualHours: item.actualHours,
        worker: 'Не назначен',
      }));

      const mapped: ExtendedRepair = {
        ...baseRepair,
        shipName: request?.shipName ?? baseRepair.shipName,
        startDate: toDate(baseRepair.actualStartDate ?? baseRepair.startDate),
        endDate: toDate(baseRepair.actualEndDate ?? baseRepair.endDate),
        repairType: tasks.length > 0 ? 'Текущий ремонт' : 'Доковый ремонт',
        priority: 'средний',
        manager: 'Не назначен',
        tasks,
      };

      setRepair(mapped);
      setNewPriority(mapped.priority);
    } catch {
      setRepair(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRepair();
  }, [repairId]);

  const completedTasks = useMemo(
    () => repair?.tasks.filter((task) => task.completed).length ?? 0,
    [repair]
  );

  if (isLoading) {
    return <div className="text-center py-12 text-gray-600">Загрузка...</div>;
  }

  if (!repair) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Ремонт не найден</h2>
        <Button onClick={() => navigate('/repairs')} className="mt-4">
          Вернуться к списку
        </Button>
      </div>
    );
  }

  const canEdit =
    user?.role === 'admin' ||
    user?.role === 'dispatcher' ||
    user?.role === 'operator' ||
    (user?.role === 'master' && user.dock === repair.dock);

  const handleStatusUpdate = async () => {
    try {
      const nextStatus: ExtendedRepair['status'] =
        repair.status === 'запланирован'
          ? 'в работе'
          : repair.status === 'в работе'
          ? 'завершён'
          : 'запланирован';

      await updateRepairStatus(repair.id, statusToBackend(nextStatus));
      await loadRepair();
    } catch {
      // noop
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/repairs')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{repair.shipName}</h1>
        <StatusBadge status={repair.status} size="md" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Ship className="h-5 w-5" />
                Информация о ремонте
              </h2>
              <PriorityBadge priority={repair.priority} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Тип ремонта</div>
                <div className="font-medium">{repair.repairType}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Док</div>
                <div className="font-medium">{repair.dock}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Дата начала</div>
                <div className="font-medium">{repair.startDate}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Дата окончания</div>
                <div className="font-medium">{repair.endDate}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Менеджер</div>
                <div className="font-medium">{repair.manager}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Repair Request ID</div>
                <div className="font-medium">#{repair.shipId}</div>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Задачи ({completedTasks}/{repair.tasks.length})
            </h2>
            <div className="space-y-3">
              {repair.tasks.length === 0 && (
                <div className="text-sm text-gray-500">По этому ремонту пока нет задач.</div>
              )}
              {repair.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/repairs/${repair.id}/tasks/${task.id}`)}
                >
                  <div className={`p-2 rounded-full ${task.completed ? 'bg-green-100' : 'bg-gray-100'}`}>
                    {task.completed ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium ${task.completed ? 'text-gray-500 line-through' : ''}`}>
                      {task.name}
                    </div>
                    <div className="text-sm text-gray-500">{task.worker}</div>
                  </div>
                  <div className="text-sm text-gray-600">{task.actualHours || task.estimatedHours}ч</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="font-semibold mb-4">Прогресс</h2>
            <div className="flex justify-center">
              <ProgressCircle progress={repair.progress} size={120} />
            </div>
          </Card>

          <Card>
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Бюджет
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Плановый</span>
                <span className="font-medium">{repair.budget.toLocaleString()} ₽</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Израсходовано</span>
                <span className="font-medium">{repair.spent.toLocaleString()} ₽</span>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm text-gray-500 mb-1">Использовано</div>
              <div className="bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${repair.budget > 0 ? (repair.spent / repair.budget) * 100 : 0}%` }}
                />
              </div>
            </div>
          </Card>

          {canEdit && (
            <Card>
              <h2 className="font-semibold mb-4">Действия</h2>
              <div className="space-y-2">
                <Button variant="secondary" className="w-full" onClick={() => setShowPriorityModal(true)}>
                  <Flag className="h-4 w-4 mr-2" />
                  Изменить приоритет
                </Button>
                <Button variant="secondary" className="w-full" disabled>
                  <Calendar className="h-4 w-4 mr-2" />
                  Назначить док (скоро)
                </Button>
                {user?.role !== 'client' && <Button className="w-full" onClick={handleStatusUpdate}>Обновить статус</Button>}
              </div>
            </Card>
          )}
        </div>
      </div>

      {showPriorityModal && (
        <Modal isOpen={showPriorityModal} onClose={() => setShowPriorityModal(false)} title="Изменить приоритет" icon={Flag}>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Приоритет</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="secondary" className="flex-1" onClick={() => setShowPriorityModal(false)}>
                Отмена
              </Button>
              <Button className="flex-1" onClick={() => setShowPriorityModal(false)}>
                Сохранить
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
