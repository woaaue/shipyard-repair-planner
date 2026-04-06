import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Anchor, Calendar, CheckCircle, Clock, AlertTriangle, Activity, CloudOff, Download, FileText } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { mockExtendedRepairs, updateRepairStatus } from '../mock-data/data';
import DowntimeForm from '../components/forms/DowntimeForm';

export default function OperatorDock() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedRepairId, setSelectedRepairId] = useState<number | null>(null);
  const [actualDate, setActualDate] = useState('');
  const [comment, setComment] = useState('');
  const [showDowntimeForm, setShowDowntimeForm] = useState(false);
  
  const userDock = user?.dock || 'Северный (200м)';
  
  const dockRepairs = mockExtendedRepairs.filter(r => r.dock === userDock);
  const activeRepairs = dockRepairs.filter(r => r.status === 'в работе');
  const plannedRepairs = dockRepairs.filter(r => r.status === 'запланирован');
  const completedRepairs = dockRepairs.filter(r => r.status === 'завершён');
  
  const loadPercentage = Math.min(100, Math.round((activeRepairs.length / 3) * 100));
  const isOverloaded = loadPercentage > 80;
  
  const handleConfirmPlacement = (repairId: number) => {
    updateRepairStatus(repairId, 'в работе');
    alert(`Постановка судна подтверждена! Ремонт #${repairId} начат.`);
    setSelectedRepairId(null);
    setActualDate('');
    setComment('');
  };
  
  const handleUpdateStatus = (repairId: number, newStatus: string) => {
    updateRepairStatus(repairId, newStatus);
    alert(`Статус ремонта обновлён на "${newStatus}"`);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Anchor className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Мой док</h1>
            <p className="text-gray-500">{userDock}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate('/reports')}>
            <FileText className="h-4 w-4 mr-2" />
            Отчёт
          </Button>
          <Button variant="secondary" onClick={() => alert('Расписание экспортировано!')}>
            <Download className="h-4 w-4 mr-2" />
            Экспорт
          </Button>
          <Button variant="secondary" onClick={() => setShowDowntimeForm(true)}>
            <CloudOff className="h-4 w-4 mr-2" />
            Простой
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <Activity className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold text-gray-900">{activeRepairs.length}</div>
            <div className="text-sm text-gray-500">В работе</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <Calendar className="h-6 w-6 mx-auto mb-2 text-orange-600" />
            <div className="text-2xl font-bold text-gray-900">{plannedRepairs.length}</div>
            <div className="text-sm text-gray-500">Запланировано</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold text-gray-900">{completedRepairs.length}</div>
            <div className="text-sm text-gray-500">Завершено</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className={`text-2xl font-bold ${isOverloaded ? 'text-red-600' : 'text-green-600'}`}>
              {loadPercentage}%
            </div>
            <div className="text-sm text-gray-500">Загрузка</div>
            {isOverloaded && (
              <div className="flex items-center justify-center gap-1 mt-1 text-xs text-red-600">
                <AlertTriangle className="h-3 w-3" />
                Перегрузка
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            Текущие ремонты ({activeRepairs.length})
          </h2>
          <div className="space-y-3">
            {activeRepairs.length === 0 ? (
              <div className="text-gray-500 text-center py-4">Нет активных ремонтов</div>
            ) : (
              activeRepairs.map(repair => (
                <div key={repair.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-medium">{repair.shipName}</div>
                      <div className="text-sm text-gray-500">{repair.startDate} - {repair.endDate}</div>
                    </div>
                    <select
                      value={repair.status}
                      onChange={(e) => handleUpdateStatus(repair.id, e.target.value)}
                      className="text-sm border rounded px-2 py-1"
                    >
                      <option value="в работе">В работе</option>
                      <option value="приостановлен">Приостановлен</option>
                      <option value="завершён">Завершён</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Прогресс: {repair.progress}%</span>
                    <span>Менеджер: {repair.manager}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-500" />
            Запланированные ремонты ({plannedRepairs.length})
          </h2>
          <div className="space-y-3">
            {plannedRepairs.length === 0 ? (
              <div className="text-gray-500 text-center py-4">Нет запланированных ремонтов</div>
            ) : (
              plannedRepairs.map(repair => (
                <div key={repair.id} className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-medium">{repair.shipName}</div>
                    <Button 
                      size="sm" 
                      onClick={() => setSelectedRepairId(repair.id)}
                    >
                      Подтвердить постановку
                    </Button>
                  </div>
                  <div className="text-sm text-gray-500">
                    {repair.startDate} - {repair.endDate}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {selectedRepairId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Подтвердить постановку судна</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Фактическая дата постановки
                </label>
                <input
                  type="date"
                  value={actualDate}
                  onChange={(e) => setActualDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Комментарий (опционально)
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Укажите причину, если дата отличается от плановой..."
                />
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="secondary" 
                  className="flex-1"
                  onClick={() => {
                    setSelectedRepairId(null);
                    setActualDate('');
                    setComment('');
                  }}
                >
                  Отмена
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => handleConfirmPlacement(selectedRepairId)}
                >
                  Подтвердить
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDowntimeForm && (
        <DowntimeForm 
          onClose={() => setShowDowntimeForm(false)}
          dockName={userDock}
        />
      )}
    </div>
  );
}
