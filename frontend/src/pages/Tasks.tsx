import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Clock } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { getWorkItems, updateWorkItemStatus, type WorkItemResponse } from '../services/workItems';
import { getRepairs } from '../services/repairs';
import { getRepairRequests } from '../services/repairRequests';
import { getSubordinates } from '../services/users';
import { useAuth } from '../context/AuthContext';

type TaskRow = WorkItemResponse & {
  repairEntityId: number | null;
  shipName: string;
  dock: string;
};

export default function Tasks() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [subordinateIds, setSubordinateIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const workItemFilters =
        user?.role === 'worker' && typeof user.id === 'number'
          ? { assigneeId: user.id }
          : undefined;
      const [items, repairs, requests, subordinates] = await Promise.all([
        getWorkItems(workItemFilters),
        getRepairs(),
        getRepairRequests(),
        user?.role === 'master' && typeof user.id === 'number' ? getSubordinates(user.id) : Promise.resolve([]),
      ]);
      const repairsMap = new Map(repairs.map((repair) => [repair.id, repair]));
      const requestsMap = new Map(requests.map((request) => [request.id, request]));

      const mapped: TaskRow[] = items.map((item) => {
        const repair = item.repairId ? repairsMap.get(item.repairId) : null;
        const request = requestsMap.get(item.repairRequestId);
        return {
          ...item,
          repairEntityId: repair?.id ?? null,
          shipName: request?.shipName ?? `Repair Request #${item.repairRequestId}`,
          dock: repair?.dock ?? '-',
        };
      });

      setTasks(mapped);
      setSubordinateIds(subordinates.map((member) => member.id));
    } catch {
      setError('Не удалось загрузить задачи');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTasks();
  }, [user?.id, user?.role]);

  const pendingTasks = useMemo(
    () => tasks.filter((task) => task.status === 'PENDING' || task.status === 'IN_PROGRESS'),
    [tasks]
  );
  const completedTasks = useMemo(() => tasks.filter((task) => task.status === 'COMPLETED'), [tasks]);
  const pendingReviewTasks = useMemo(
    () => tasks.filter((task) => task.reviewStatus === 'PENDING_REVIEW'),
    [tasks]
  );

  const visiblePendingTasks = useMemo(() => {
    if (user?.role === 'worker') {
      return pendingTasks;
    }
    if (user?.role === 'master') {
      return pendingTasks.filter((task) => task.assigneeId !== null && subordinateIds.includes(task.assigneeId));
    }
    return pendingTasks;
  }, [pendingTasks, subordinateIds, user]);

  const visiblePendingReviewTasks = useMemo(() => {
    if (user?.role === 'master') {
      return pendingReviewTasks.filter((task) => task.assigneeId !== null && subordinateIds.includes(task.assigneeId));
    }
    return pendingReviewTasks;
  }, [pendingReviewTasks, subordinateIds, user]);

  const handleCompleteTask = async (taskId: number) => {
    setError(null);
    try {
      await updateWorkItemStatus(taskId, 'COMPLETED');
      await loadTasks();
    } catch {
      setError('Не удалось обновить статус задачи');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Мои задачи</h1>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-500" />
            <span>{visiblePendingTasks.length} в работе</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>{completedTasks.length} выполнено</span>
          </div>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}
      {loading && <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">Загрузка...</div>}

      <div className={`grid grid-cols-1 ${user?.role === 'master' ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-6`}>
        <Card>
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            Задачи в работе ({visiblePendingTasks.length})
          </h2>
          <div className="space-y-3">
            {visiblePendingTasks.length === 0 ? (
              <div className="text-gray-500 text-center py-4">Нет активных задач</div>
            ) : (
              visiblePendingTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <div>
                      <div className="font-medium">{task.name}</div>
                      <div className="text-sm text-gray-500">
                        {task.shipName} • {task.dock}
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">{task.status}</span>
                  </div>
                  <div className="text-xs text-gray-500">Проверка: {task.reviewStatus}</div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="text-sm text-gray-600">
                      {task.actualHours || task.estimatedHours}ч / план {task.estimatedHours}ч
                    </div>
                    {user?.role === 'worker' && (
                      <Button size="sm" onClick={() => void handleCompleteTask(task.id)}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Выполнить
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => navigate(`/repairs/${task.repairEntityId ?? 0}/tasks/${task.id}`)}
                    >
                      Открыть
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {user?.role === 'master' && (
          <Card>
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              На проверке ({visiblePendingReviewTasks.length})
            </h2>
            <div className="space-y-3">
              {visiblePendingReviewTasks.length === 0 ? (
                <div className="text-gray-500 text-center py-4">Нет задач на проверке</div>
              ) : (
                visiblePendingReviewTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="font-medium">{task.name}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {task.assigneeFullName || 'Не назначен'} • {task.shipName}
                    </div>
                    <div className="flex justify-end mt-3">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => navigate(`/repairs/${task.repairEntityId ?? 0}/tasks/${task.id}`)}
                      >
                        Открыть проверку
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}

        <Card>
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Выполненные задачи ({completedTasks.length})
          </h2>
          <div className="space-y-3">
            {completedTasks.length === 0 ? (
              <div className="text-gray-500 text-center py-4">Нет выполненных задач</div>
            ) : (
              completedTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 border rounded-lg bg-green-50 cursor-pointer"
                  onClick={() => navigate(`/repairs/${task.repairEntityId ?? 0}/tasks/${task.id}`)}
                >
                  <div className="font-medium line-through text-gray-500">{task.name}</div>
                  <div className="text-sm text-gray-500 mt-1">{task.shipName}</div>
                  <div className="text-sm text-gray-600 mt-2">{task.actualHours || task.estimatedHours}ч</div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
