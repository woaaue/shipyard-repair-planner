import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import { getWorkItems, updateWorkItemStatus, type WorkItemResponse } from '../services/workItems';
import { getRepairs } from '../services/repairs';
import { getRepairRequests } from '../services/repairRequests';
import { getSubordinates } from '../services/users';
import { useAuth } from '../context/AuthContext';
import { WORK_REVIEW_STATUS_LABELS, WORK_STATUS_LABELS } from '../constants/labels';
import V7PageHeader from '../components/v7/V7PageHeader';
import V7Panel from '../components/v7/V7Panel';
import V7PanelTitle from '../components/v7/V7PanelTitle';
import V7StateText from '../components/v7/V7StateText';
import {
  canMarkWorkItemCompleted,
  getWorkItemUiState,
  isWorkItemCompleted,
} from '../domain/workflow/workItemWorkflow';

type TaskRow = WorkItemResponse & {
  repairEntityId: number | null;
  operatorId: number | null;
  shipName: string;
  dock: string;
};

export default function Tasks() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [subordinateIds, setSubordinateIds] = useState<number[]>([]);
  const [dispatcherOperatorIds, setDispatcherOperatorIds] = useState<number[]>([]);
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
        (user?.role === 'master' || user?.role === 'dispatcher') && typeof user.id === 'number'
          ? getSubordinates(user.id)
          : Promise.resolve([]),
      ]);
      const repairsMap = new Map(repairs.map((repair) => [repair.id, repair]));
      const requestsMap = new Map(requests.map((request) => [request.id, request]));

      const mapped: TaskRow[] = items.map((item) => {
        const repair = item.repairId ? repairsMap.get(item.repairId) : null;
        const request = requestsMap.get(item.repairRequestId);
        return {
          ...item,
          repairEntityId: repair?.id ?? null,
          operatorId: repair?.operatorId ?? null,
          shipName: request?.shipName ?? `Заявка #${item.repairRequestId}`,
          dock: repair?.dock ?? '-',
        };
      });

      setTasks(mapped);
      if (user?.role === 'master') {
        setSubordinateIds(subordinates.map((member) => member.id));
      } else {
        setSubordinateIds([]);
      }
      if (user?.role === 'dispatcher') {
        setDispatcherOperatorIds(
          subordinates.filter((member) => member.role === 'operator').map((member) => member.id)
        );
      } else {
        setDispatcherOperatorIds([]);
      }
    } catch {
      setError('Не удалось загрузить задачи');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTasks();
  }, [user?.id, user?.role]);

  const visibleTasks = useMemo(() => {
    if (user?.role === 'worker') {
      return tasks;
    }
    if (user?.role === 'master') {
      return tasks.filter((task) => task.assigneeId !== null && subordinateIds.includes(task.assigneeId));
    }
    if (user?.role === 'operator' && typeof user.id === 'number') {
      return tasks.filter((task) => task.operatorId === user.id);
    }
    if (user?.role === 'dispatcher') {
      return tasks.filter((task) => {
        if (typeof task.operatorId !== 'number') return false;
        return dispatcherOperatorIds.includes(task.operatorId);
      });
    }
    return tasks;
  }, [tasks, subordinateIds, dispatcherOperatorIds, user]);

  const pendingTasks = useMemo(
    () =>
      visibleTasks.filter((task) => {
        if (user?.role === 'worker') {
          return !isWorkItemCompleted(task);
        }
        return !isWorkItemCompleted(task) && task.reviewStatus !== 'PENDING_REVIEW';
      }),
    [visibleTasks, user?.role]
  );
  const completedTasks = useMemo(
    () => visibleTasks.filter((task) => task.reviewStatus === 'APPROVED'),
    [visibleTasks]
  );
  const pendingReviewTasks = useMemo(
    () => visibleTasks.filter((task) => task.reviewStatus === 'PENDING_REVIEW'),
    [visibleTasks]
  );

  const visiblePendingTasks = pendingTasks;

  const visiblePendingReviewTasks = useMemo(() => {
    if (user?.role === 'master') {
      return pendingReviewTasks.filter((task) => task.assigneeId !== null && subordinateIds.includes(task.assigneeId));
    }
    if (user?.role === 'operator' || user?.role === 'dispatcher') {
      return pendingReviewTasks;
    }
    return [];
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
      <V7PageHeader
        title={user?.role === 'worker' ? 'Мои работы' : 'Работы и проверка'}
        description="Рабочий контур задач с фильтрами по исполнителю и статусу проверки."
        actions={
          <div className="flex gap-2 text-sm text-[var(--muted)]">
            <span>{visiblePendingTasks.length} в работе</span>
            <span>{completedTasks.length} выполнено</span>
          </div>
        }
      />

      {error && <div className="px-4 py-3 rounded-lg border bg-[var(--danger-bg)] border-[var(--danger-line)] text-[var(--danger-ink)]">{error}</div>}
      {loading && <div className="px-4 py-3 rounded-lg border bg-[var(--soft)] border-[var(--line)] text-[var(--muted)]">Загрузка...</div>}

      <div
        className={`grid grid-cols-1 ${
          user?.role === 'master' || user?.role === 'operator' || user?.role === 'dispatcher'
            ? 'lg:grid-cols-3'
            : 'lg:grid-cols-2'
        } gap-6`}
      >
        <V7Panel>
          <V7PanelTitle title={`Задачи в работе (${visiblePendingTasks.length})`} />
          <div className="space-y-3">
            {visiblePendingTasks.length === 0 ? (
              <div className="text-gray-500 text-center py-4">Нет активных задач</div>
            ) : (
              visiblePendingTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 border border-[var(--line)] rounded-lg hover:shadow-md transition-shadow bg-white"
                >
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <div>
                      <div className="font-medium">{task.name}</div>
                      <div className="text-sm text-[var(--muted)]">
                        {task.shipName} • {task.dock}
                      </div>
                    </div>
                    <V7StateText
                      value={
                        getWorkItemUiState(task) === 'PENDING_REVIEW'
                          ? 'НА ПРОВЕРКЕ'
                          : getWorkItemUiState(task) === 'COMPLETED'
                            ? 'ВЫПОЛНЕНО'
                            : WORK_STATUS_LABELS[task.status] ?? task.status
                      }
                    />
                  </div>
                  <div className="text-xs text-[var(--muted)]">
                    Проверка: {WORK_REVIEW_STATUS_LABELS[task.reviewStatus] ?? task.reviewStatus}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="text-sm text-[var(--muted)]">
                      {task.actualHours || task.estimatedHours}ч / план {task.estimatedHours}ч
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                      {user?.role === 'worker' && canMarkWorkItemCompleted(user.role, task, user.id) && (
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
                </div>
              ))
            )}
          </div>
        </V7Panel>

        {(user?.role === 'master' || user?.role === 'operator' || user?.role === 'dispatcher') && (
          <V7Panel>
            <V7PanelTitle
              title={`На проверке (${visiblePendingReviewTasks.length})`}
             
            />
            <div className="space-y-3">
              {visiblePendingReviewTasks.length === 0 ? (
                <div className="text-gray-500 text-center py-4">Нет задач на проверке</div>
              ) : (
                visiblePendingReviewTasks.map((task) => (
                  <div
                    key={task.id}
                  className="p-4 border border-[var(--line)] rounded-lg hover:shadow-md transition-shadow bg-white"
                  >
                    <div className="font-medium">{task.name}</div>
                    <div className="text-sm text-[var(--muted)] mt-1">
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
          </V7Panel>
        )}

        <V7Panel>
          <V7PanelTitle title={`Выполненные (${completedTasks.length})`} />
          <div className="space-y-3">
            {completedTasks.length === 0 ? (
              <div className="text-gray-500 text-center py-4">Нет выполненных задач</div>
            ) : (
              completedTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 border border-[var(--line)] rounded-lg bg-[var(--soft)] cursor-pointer"
                  onClick={() => navigate(`/repairs/${task.repairEntityId ?? 0}/tasks/${task.id}`)}
                >
                  <div className="font-medium line-through text-[var(--muted)]">{task.name}</div>
                  <div className="text-sm text-[var(--muted)] mt-1">{task.shipName}</div>
                  <div className="text-sm text-[var(--ink)] mt-2">{task.actualHours || task.estimatedHours}ч</div>
                </div>
              ))
            )}
          </div>
        </V7Panel>
      </div>
    </div>
  );
}

