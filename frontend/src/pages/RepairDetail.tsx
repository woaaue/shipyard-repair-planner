import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Ship, DollarSign, CheckCircle, Clock, Calendar, Flag } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import PriorityBadge from '../components/ui/PriorityBadge';
import ProgressCircle from '../components/ui/ProgressCircle';
import Modal from '../components/ui/Modal';
import { mockExtendedRepairs, dockNames } from '../mock-data/data';
import { useAuth } from '../context/AuthContext';

const PRIORITIES = ['низкий', 'средний', 'высокий', 'критический'] as const;

export default function RepairDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const repairId = parseInt(id || '0');
  const repair = mockExtendedRepairs.find(r => r.id === repairId);
  
  const [showDockModal, setShowDockModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [selectedDock, setSelectedDock] = useState(repair?.dock || '');
  const [newBudget, setNewBudget] = useState(repair?.budget || 0);
  const [newStartDate, setNewStartDate] = useState(repair?.startDate || '');
  const [newEndDate, setNewEndDate] = useState(repair?.endDate || '');
  const [newPriority, setNewPriority] = useState<string>(repair?.priority || 'средний');
  
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
  
  const canEdit = user?.role === 'admin' || user?.role === 'dispatcher' || user?.role === 'operator' || (user?.role === 'master' && user.dock === repair.dock);
  const completedTasks = repair.tasks.filter(t => t.completed).length;
  
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
                <div className="text-sm text-gray-500">Судно (ID)</div>
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
              {repair.tasks.map(task => (
                <div key={task.id} className="flex items-center gap-4 p-3 border rounded-lg">
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
                  <div className="text-sm text-gray-600">
                    {task.actualHours || task.estimatedHours}ч
                  </div>
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
              <div className="pt-3 border-t">
                <div className="flex justify-between">
                  <span className="text-gray-600">Остаток</span>
                  <span className="font-medium text-green-600">
                    {(repair.budget - repair.spent).toLocaleString()} ₽
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm text-gray-500 mb-1">Использовано</div>
              <div className="bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${(repair.spent / repair.budget) * 100}%` }}
                />
              </div>
            </div>
          </Card>
          
          {repair.delayReason && (
            <Card>
              <h2 className="font-semibold mb-2 text-orange-600">Причина задержки</h2>
              <p className="text-gray-600">{repair.delayReason}</p>
            </Card>
          )}
          
          {canEdit && (
            <Card>
              <h2 className="font-semibold mb-4">Действия</h2>
              <div className="space-y-2">
                <Button variant="secondary" className="w-full" onClick={() => setShowPriorityModal(true)}>
                  <Flag className="h-4 w-4 mr-2" />
                  Изменить приоритет
                </Button>
                <Button variant="secondary" className="w-full" onClick={() => setShowDockModal(true)}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Назначить док
                </Button>
                <Button variant="secondary" className="w-full" onClick={() => setShowBudgetModal(true)}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Изменить бюджет
                </Button>
                {user?.role !== 'client' && (
                  <Button className="w-full">
                    Обновить статус
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {showDockModal && (
        <Modal isOpen={showDockModal} onClose={() => setShowDockModal(false)} title="Назначить док" icon={Ship}>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Док</label>
              <select
                value={selectedDock}
                onChange={(e) => setSelectedDock(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Выберите док</option>
                {dockNames.map(dock => (
                  <option key={dock} value={dock}>{dock}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Дата начала</label>
              <input
                type="date"
                value={newStartDate}
                onChange={(e) => setNewStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Дата окончания</label>
              <input
                type="date"
                value={newEndDate}
                onChange={(e) => setNewEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="secondary" className="flex-1" onClick={() => setShowDockModal(false)}>
                Отмена
              </Button>
              <Button className="flex-1" onClick={() => setShowDockModal(false)}>
                Сохранить
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showBudgetModal && (
        <Modal isOpen={showBudgetModal} onClose={() => setShowBudgetModal(false)} title="Изменить бюджет" icon={DollarSign}>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Плановый бюджет (₽)</label>
              <input
                type="number"
                value={newBudget}
                onChange={(e) => setNewBudget(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Израсходовано:</span>
                <span className="font-medium">{repair?.spent.toLocaleString()} ₽</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-600">Остаток:</span>
                <span className="font-medium text-green-600">
                  {((repair?.budget || 0) - (repair?.spent || 0)).toLocaleString()} ₽
                </span>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="secondary" className="flex-1" onClick={() => setShowBudgetModal(false)}>
                Отмена
              </Button>
              <Button className="flex-1" onClick={() => setShowBudgetModal(false)}>
                Сохранить
              </Button>
            </div>
          </div>
        </Modal>
      )}

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
                {PRIORITIES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="secondary" className="flex-1" onClick={() => setShowPriorityModal(false)}>
                Отмена
              </Button>
              <Button className="flex-1" onClick={() => {
                if (repair) {
                  repair.priority = newPriority as any;
                }
                setShowPriorityModal(false);
              }}>
                Сохранить
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}