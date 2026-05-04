import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, FileText } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuth, type User } from '../context/AuthContext';
import { getSubordinates } from '../services/users';
import {
  getWorkItem,
  updateWorkItemStatus,
  updateWorkItemAssignee,
  updateWorkItemReview,
  type WorkItemResponse,
} from '../services/workItems';

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
    const loadSubordinates = async () => {
      if (user?.role !== 'master' || typeof user.id !== 'number') {
        setSubordinates([]);
        return;
      }

      try {
        const data = await getSubordinates(user.id);
        setSubordinates(data.filter((member) => member.role === 'worker'));
      } catch {
        setSubordinates([]);
      }
    };

    void loadSubordinates();
  }, [user?.id, user?.role]);

  useEffect(() => {
    if (!task) return;
    setSelectedAssignee(task.assigneeId ? String(task.assigneeId) : '');
  }, [task]);

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Загрузка...</div>;
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Задача не найдена</h2>
        <Button onClick={() => navigate('/tasks')} className="mt-4">
          Вернуться к списку
        </Button>
      </div>
    );
  }

  const completed = task.status === 'COMPLETED';
  const canEdit = user?.role === 'master' || user?.role === 'dispatcher' || user?.role === 'admin';
  const canReview = user?.role === 'master';

  const handleComplete = async () => {
    setActionError(null);
    setIsCompleting(true);
    try {
      await updateWorkItemStatus(task.id, 'COMPLETED');
      await loadTask();
    } catch {
      setActionError('Не удалось завершить задачу');
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
    } catch {
      setActionError('Не удалось назначить исполнителя');
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
    } catch {
      setActionError('Не удалось обновить результат проверки');
    } finally {
      setIsReviewing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/repairs/${numericRepairId}`)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Задача: {task.name}</h1>
      </div>

      {actionError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{actionError}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Описание задачи
            </h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500">Название</div>
                <div className="font-medium">{task.name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Категория</div>
                <div className="font-medium">{task.category}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Статус</div>
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${
                    completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {completed ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                  {completed ? 'Выполнено' : 'В работе'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Проверка</div>
                <div className="font-medium">{task.reviewStatus}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Исполнитель</div>
                <div className="font-medium">{task.assigneeFullName || 'Не назначен'}</div>
              </div>
              {task.description && (
                <div>
                  <div className="text-sm text-gray-500">Описание</div>
                  <div className="font-medium">{task.description}</div>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="font-semibold mb-4">Время</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Плановое</span>
                <span className="font-medium">{task.estimatedHours} ч</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Фактическое</span>
                <span className="font-medium">{task.actualHours || 0} ч</span>
              </div>
              {(task.actualHours || 0) > task.estimatedHours && (
                <div className="pt-3 border-t text-orange-600">
                  Превышение: {(task.actualHours || 0) - task.estimatedHours} ч
                </div>
              )}
            </div>
          </Card>

          {canEdit && (
            <Card>
              <h2 className="font-semibold mb-4">Действия</h2>
              <div className="space-y-2">
                {!completed && (
                  <Button className="w-full" onClick={() => void handleComplete()} disabled={isCompleting}>
                    {isCompleting ? 'Обновление...' : 'Отметить выполненной'}
                  </Button>
                )}
                <Button variant="secondary" className="w-full" disabled>
                  Редактировать (скоро)
                </Button>
              </div>
            </Card>
          )}

          {canReview && (
            <Card>
              <h2 className="font-semibold mb-4">Назначение и проверка</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Исполнитель</label>
                  <select
                    value={selectedAssignee}
                    onChange={(event) => setSelectedAssignee(event.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                    disabled={isReviewing || task.reviewStatus !== 'PENDING_REVIEW'}
                  >
                    Вернуть
                  </Button>
                  <Button
                    onClick={() => void handleReview('APPROVED')}
                    disabled={isReviewing || task.reviewStatus !== 'PENDING_REVIEW'}
                  >
                    Принять
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
