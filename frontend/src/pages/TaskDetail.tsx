import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import axios from 'axios';
import Button from '../components/ui/Button';
import { useAuth, type User } from '../context/AuthContext';
import { getSubordinates, getUsers } from '../services/users';
import {
  getWorkItem,
  updateWorkItemStatus,
  updateWorkItemAssignee,
  updateWorkItemReview,
  type WorkItemResponse,
} from '../services/workItems';
import { WORK_CATEGORY_LABELS, WORK_REVIEW_STATUS_LABELS } from '../constants/labels';
import V7PageHeader from '../components/v7/V7PageHeader';
import V7Panel from '../components/v7/V7Panel';
import V7PanelTitle from '../components/v7/V7PanelTitle';
import V7StateText from '../components/v7/V7StateText';
import {
  canMarkWorkItemCompleted,
  canReviewWorkItem,
  getWorkItemUiState,
  isWorkItemCompleted,
} from '../domain/workflow/workItemWorkflow';

function extractApiErrorMessage(error: unknown): string | null {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)?.message;
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
  }
  return null;
}

export default function TaskDetail() {
  const { repairId, taskId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [task, setTask] = useState<WorkItemResponse | null>(null);
  const [subordinates, setSubordinates] = useState<User[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);

  const numericTaskId = Number(taskId || '0');
  const numericRepairId = Number(repairId || '0');

  const loadTask = async () => {
    if (!numericTaskId) {
      setTask(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await getWorkItem(numericTaskId);
      setTask(data);
    } catch {
      setTask(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTask();
  }, [numericTaskId]);

  useEffect(() => {
    const loadWorkers = async () => {
      if (!user) {
        setSubordinates([]);
        return;
      }

      try {
        if (user.role === 'admin') {
          const workers = await getUsers({ role: 'worker' });
          setSubordinates(workers);
          return;
        }

        if (
          (user.role === 'master' || user.role === 'operator' || user.role === 'dispatcher') &&
          typeof user.id === 'number'
        ) {
          const data = await getSubordinates(user.id);
          setSubordinates(data.filter((member) => member.role === 'worker'));
          return;
        }

        setSubordinates([]);
      } catch {
        setSubordinates([]);
      }
    };

    void loadWorkers();
  }, [user?.id, user?.role]);

  useEffect(() => {
    if (!task) return;
    setSelectedAssignee(task.assigneeId ? String(task.assigneeId) : '');
  }, [task]);

  if (loading) {
    return <div className="text-center py-12 text-[var(--muted)]">Загрузка...</div>;
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-[var(--ink)]">Задача не найдена</h2>
        <Button onClick={() => navigate('/tasks')} className="mt-4">
          Вернуться к списку
        </Button>
      </div>
    );
  }

  const completed = isWorkItemCompleted(task);
  const uiState = getWorkItemUiState(task);
  const canManageTask =
    user?.role === 'master' ||
    user?.role === 'operator' ||
    user?.role === 'dispatcher' ||
    user?.role === 'admin';
  const canComplete = canMarkWorkItemCompleted(user?.role, task, user?.id);
  const canReview = canManageTask && canReviewWorkItem(user?.role, task);
  const backToTasks = user?.role === 'worker' || !numericRepairId;
  const backPath = backToTasks ? '/tasks' : `/repairs/${numericRepairId}`;
  const backLabel = backToTasks ? 'К задачам' : 'К ремонту';

  const handleComplete = async () => {
    setActionError(null);
    setIsCompleting(true);
    try {
      await updateWorkItemStatus(task.id, 'COMPLETED');
      await loadTask();
    } catch (error) {
      setActionError(extractApiErrorMessage(error) ?? 'Не удалось завершить задачу');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleAssign = async () => {
    setActionError(null);
    setIsAssigning(true);
    try {
      const assigneeId = selectedAssignee ? Number(selectedAssignee) : null;
      await updateWorkItemAssignee(task.id, assigneeId);
      await loadTask();
    } catch (error) {
      setActionError(extractApiErrorMessage(error) ?? 'Не удалось назначить исполнителя');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleReview = async (reviewStatus: 'APPROVED' | 'REJECTED') => {
    setActionError(null);
    setIsReviewing(true);
    try {
      await updateWorkItemReview(task.id, reviewStatus);
      await loadTask();
    } catch (error) {
      setActionError(extractApiErrorMessage(error) ?? 'Не удалось обновить результат проверки');
    } finally {
      setIsReviewing(false);
    }
  };

  return (
    <div className="space-y-6">
      <V7PageHeader
        title={`Задача: ${task.name}`}
        description="Карточка задачи"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => navigate(backPath)} icon={ArrowLeft}>
              {backLabel}
            </Button>
            <V7StateText value={completed ? 'ВЫПОЛНЕНО' : uiState === 'PENDING_REVIEW' ? 'НА ПРОВЕРКЕ' : 'В РАБОТЕ'} />
          </div>
        }
      />

      {actionError && <div className="px-4 py-3 rounded-lg border bg-[var(--danger-bg)] border-[var(--danger-line)] text-[var(--danger-ink)]">{actionError}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <V7Panel>
            <V7PanelTitle title="Описание задачи" extra={<FileText className="h-4 w-4 text-[var(--muted)]" />} />
            <div className="space-y-4">
              <div>
                <div className="text-sm text-[var(--muted)]">Название</div>
                <div className="font-medium">{task.name}</div>
              </div>
              <div>
                <div className="text-sm text-[var(--muted)]">Категория</div>
                <div className="font-medium">{WORK_CATEGORY_LABELS[task.category] ?? task.category}</div>
              </div>
              <div>
                <div className="text-sm text-[var(--muted)]">Статус</div>
                <V7StateText value={completed ? 'ВЫПОЛНЕНО' : uiState === 'PENDING_REVIEW' ? 'НА ПРОВЕРКЕ' : 'В РАБОТЕ'} />
              </div>
              <div>
                <div className="text-sm text-[var(--muted)]">Проверка</div>
                <div className="font-medium">{WORK_REVIEW_STATUS_LABELS[task.reviewStatus] ?? task.reviewStatus}</div>
              </div>
              <div>
                <div className="text-sm text-[var(--muted)]">Исполнитель</div>
                <div className="font-medium">{task.assigneeFullName || 'Не назначен'}</div>
              </div>
              {task.description && (
                <div>
                  <div className="text-sm text-[var(--muted)]">Описание</div>
                  <div className="font-medium">{task.description}</div>
                </div>
              )}
            </div>
          </V7Panel>
        </div>

        <div className="space-y-6">
          <V7Panel>
            <V7PanelTitle title="Время" />
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Плановое</span>
                <span className="font-medium">{task.estimatedHours} ч</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Фактическое</span>
                <span className="font-medium">{task.actualHours || 0} ч</span>
              </div>
              {(task.actualHours || 0) > task.estimatedHours && (
                <div className="pt-3 border-t border-[var(--line)] text-[var(--muted)]">
                  Превышение: {(task.actualHours || 0) - task.estimatedHours} ч
                </div>
              )}
            </div>
          </V7Panel>

          {canComplete && (
            <V7Panel>
              <V7PanelTitle title="Действия" />
              <div className="space-y-2">
                <Button className="w-full" onClick={() => void handleComplete()} disabled={isCompleting}>
                  {isCompleting ? 'Обновление...' : 'Отметить выполненной'}
                </Button>
                <div className="text-xs text-[var(--muted)] px-1">
                  Если нужно изменить название, описание или время, обратитесь к мастеру.
                </div>
              </div>
            </V7Panel>
          )}

          {canReview && (
            <V7Panel>
              <V7PanelTitle title="Назначение и проверка" />
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-1">Исполнитель</label>
                  <select
                    value={selectedAssignee}
                    onChange={(event) => setSelectedAssignee(event.target.value)}
                    className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)]"
                  >
                    <option value="">Не назначен</option>
                    {subordinates.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.fullName}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  className="w-full"
                  variant="secondary"
                  onClick={() => void handleAssign()}
                  disabled={isAssigning}
                >
                  {isAssigning ? 'Сохранение...' : 'Назначить исполнителя'}
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => void handleReview('REJECTED')}
                    disabled={isReviewing || !canReviewWorkItem(user?.role, task)}
                  >
                    Вернуть
                  </Button>
                  <Button
                    onClick={() => void handleReview('APPROVED')}
                    disabled={isReviewing || !canReviewWorkItem(user?.role, task)}
                  >
                    Принять
                  </Button>
                </div>
              </div>
            </V7Panel>
          )}
        </div>
      </div>
    </div>
  );
}
