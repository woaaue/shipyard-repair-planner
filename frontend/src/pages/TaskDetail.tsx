import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, FileText } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { mockExtendedRepairs } from '../mock-data/data';
import { useAuth } from '../context/AuthContext';

export default function TaskDetail() {
  const { repairId, taskId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const rId = parseInt(repairId || '0');
  const tId = parseInt(taskId || '0');
  
  const repair = mockExtendedRepairs.find(r => r.id === rId);
  const task = repair?.tasks.find(t => t.id === tId);
  
  if (!task) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Задача не найдена</h2>
        <Button onClick={() => navigate('/repairs')} className="mt-4">
          Вернуться к списку
        </Button>
      </div>
    );
  }
  
  const canEdit = user?.role === 'master' || user?.role === 'dispatcher' || user?.role === 'admin';
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/repairs/${rId}`)}
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
                <div className="text-sm text-gray-500">Исполнитель</div>
                <div className="font-medium">{task.worker}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Статус</div>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${
                  task.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {task.completed ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )}
                  {task.completed ? 'Выполнено' : 'В работе'}
                </div>
              </div>
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
                  Превышение: {((task.actualHours || 0) - task.estimatedHours)} ч
                </div>
              )}
            </div>
          </Card>
          
          {canEdit && (
            <Card>
              <h2 className="font-semibold mb-4">Действия</h2>
              <div className="space-y-2">
                {!task.completed && (
                  <Button className="w-full">
                    Отметить выполненной
                  </Button>
                )}
                <Button variant="secondary" className="w-full">
                  Редактировать
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}