import { useState } from 'react';
import { CheckCircle, Clock, User, AlertTriangle, Send, X, Check, UserPlus } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { mockExtendedRepairs } from '../mock-data/data';
import { useAuth } from '../context/AuthContext';

const WORKERS = [
  'Слесарь Петров',
  'Сварщик Сидоров',
  'Электроник Иванов',
  'Маляр Кузнецов',
  'Моторист Смирнов'
];

export default function Tasks() {
  const { user } = useAuth();
  const [completedTaskIds, setCompletedTaskIds] = useState<number[]>([]);
  const [assignedTaskIds, setAssignedTaskIds] = useState<Record<number, string>>({});
  const [showProblemModal, setShowProblemModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [problemType, setProblemType] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [selectedWorker, setSelectedWorker] = useState('');
  
  const allTasks = mockExtendedRepairs.flatMap(repair => 
    repair.tasks.map(task => ({
      ...task,
      repairId: repair.id,
      shipName: repair.shipName,
      dock: repair.dock,
      repairStatus: repair.status,
      repairProgress: repair.progress
    }))
  );
  
  const myTasks = allTasks.filter(task => {
    if (user?.role === 'worker') {
      return !completedTaskIds.includes(task.id);
    }
    if (user?.role === 'master' && user.dock) {
      return task.dock === user.dock;
    }
    return true;
  });
  
  const pendingTasks = myTasks.filter(t => !t.completed && !completedTaskIds.includes(t.id));
  const completedTasks = allTasks.filter(t => t.completed || completedTaskIds.includes(t.id));
  const unassignedTasksCount = pendingTasks.filter(t => !assignedTaskIds[t.id]).length;
  
  const handleCompleteTask = (taskId: number) => {
    setCompletedTaskIds(prev => [...prev, taskId]);
  };
  
  const handleReportProblem = (taskId: number) => {
    setSelectedTaskId(taskId);
    setShowProblemModal(true);
  };
  
  const handleSubmitProblem = () => {
    alert(`Проблема "${problemType}" сообщена мастеру участка!`);
    setShowProblemModal(false);
    setProblemType('');
    setProblemDescription('');
  };
  
  const handleAssignTask = (taskId: number) => {
    setSelectedTaskId(taskId);
    setSelectedWorker(assignedTaskIds[taskId] || '');
    setShowAssignModal(true);
  };
  
  const handleSaveAssignment = () => {
    if (selectedTaskId && selectedWorker) {
      setAssignedTaskIds(prev => ({ ...prev, [selectedTaskId]: selectedWorker }));
    }
    setShowAssignModal(false);
    alert(`Задача назначена рабочему ${selectedWorker}`);
  };
  
  const handleAcceptTask = (_taskId: number) => {
    alert(`Задача принята!`);
  };
  
  const handleRejectTask = (_taskId: number) => {
    alert(`Задача отклонена и возвращена на доработку.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Мои задачи</h1>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-500" />
            <span>{pendingTasks.length} в работе</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>{completedTasks.length} выполнено</span>
          </div>
        </div>
      </div>

      {user?.role === 'master' && (
        <Card>
          <h2 className="font-semibold mb-4">Сводка по участку</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{myTasks.length}</div>
              <div className="text-sm text-gray-600">Всего задач</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{pendingTasks.length}</div>
              <div className="text-sm text-gray-600">В работе</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{unassignedTasksCount}</div>
              <div className="text-sm text-gray-600">Не назначено</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
              <div className="text-sm text-gray-600">Выполнено</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round((completedTasks.length / (myTasks.length || 1)) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Готовность</div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            Задачи в работе ({pendingTasks.length})
          </h2>
          <div className="space-y-3">
            {pendingTasks.length === 0 ? (
              <div className="text-gray-500 text-center py-4">Нет активных задач</div>
            ) : (
              pendingTasks.map(task => (
                <div key={task.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-medium">{task.name}</div>
                      <div className="text-sm text-gray-500">{task.shipName} • {task.dock}</div>
                    </div>
                    {user?.role === 'worker' && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => handleReportProblem(task.id)}>
                          <AlertTriangle className="h-4 w-4" />
                        </Button>
                        <Button size="sm" onClick={() => handleCompleteTask(task.id)}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Выполнить
                        </Button>
                      </div>
                    )}
                    {user?.role === 'master' && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => handleAssignTask(task.id)}>
                          <Send className="h-4 w-4 mr-1" />
                          Назначить
                        </Button>
                        {assignedTaskIds[task.id] && (
                          <>
                            <Button size="sm" onClick={() => handleAcceptTask(task.id)}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => handleRejectTask(task.id)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="h-4 w-4" />
                      {task.worker}
                    </div>
                    <div className="text-sm text-gray-600">
                      {task.estimatedHours}ч (план)
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Выполненные задачи ({completedTasks.length})
          </h2>
          <div className="space-y-3">
            {completedTasks.length === 0 ? (
              <div className="text-gray-500 text-center py-4">Нет выполненных задач</div>
            ) : (
              completedTasks.map(task => (
                <div key={task.id} className="p-4 border rounded-lg bg-green-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium line-through text-gray-500">{task.name}</div>
                      <div className="text-sm text-gray-500">{task.shipName}</div>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span>{task.actualHours || task.estimatedHours}ч</span>
                    {(task.actualHours || 0) > task.estimatedHours && (
                      <span className="text-orange-600">+{(task.actualHours || 0) - task.estimatedHours}ч</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {showProblemModal && (
        <Modal isOpen={showProblemModal} onClose={() => setShowProblemModal(false)} title="Сообщить о проблеме" icon={AlertTriangle}>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Тип проблемы</label>
              <select
                value={problemType}
                onChange={(e) => setProblemType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Выберите тип</option>
                <option value="materials">Нехватка материалов</option>
                <option value="defect">Обнаружен дефект</option>
                <option value="delay">Задержка работ</option>
                <option value="other">Другое</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
              <textarea
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Опишите проблему..."
              />
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowProblemModal(false)}>
                Отмена
              </Button>
              <Button className="flex-1" onClick={handleSubmitProblem}>
                Отправить
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showAssignModal && (
        <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Назначить задачу" icon={UserPlus}>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Исполнитель</label>
              <select
                value={selectedWorker}
                onChange={(e) => setSelectedWorker(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Выберите рабочего</option>
                {WORKERS.map(worker => (
                  <option key={worker} value={worker}>{worker}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowAssignModal(false)}>
                Отмена
              </Button>
              <Button className="flex-1" onClick={handleSaveAssignment}>
                Назначить
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}