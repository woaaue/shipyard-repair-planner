import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, FileText } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { getWorkItem, updateWorkItemStatus, type WorkItemResponse } from '../services/workItems';

export default function TaskDetail() {
  const { repairId, taskId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [task, setTask] = useState<WorkItemResponse | null>(null);
  const [loading, setLoading] = useState(true);

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

  const handleComplete = async () => {
    await updateWorkItemStatus(task.id, 'COMPLETED');
    await loadTask();
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
                  <Button className="w-full" onClick={() => void handleComplete()}>
                    Отметить выполненной
                  </Button>
                )}
                <Button variant="secondary" className="w-full" disabled>
                  Редактировать (скоро)
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
