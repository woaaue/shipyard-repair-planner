import { useState } from 'react';
import { FileText, Download } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { mockExtendedRepairs } from '../mock-data/data';
import { useAuth } from '../context/AuthContext';

type ReportType = 'repairs' | 'ships' | 'budget' | 'docks';
type Period = 'week' | 'month' | 'quarter' | 'year';

export default function Reports() {
  const { user } = useAuth();
  const [reportType, setReportType] = useState<ReportType>('repairs');
  const [period, setPeriod] = useState<Period>('month');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      alert('Отчёт сгенерирован! (Демо)');
    }, 1500);
  };

  const getFilteredRepairs = () => {
    let repairs = [...mockExtendedRepairs];
    
    if (user?.role === 'operator' && user.dock) {
      repairs = repairs.filter(r => r.dock === user.dock);
    }
    
    if (user?.role === 'client' && user.shipId) {
      repairs = repairs.filter(r => r.shipId === user.shipId);
    }
    
    return repairs;
  };

  const getStats = () => {
    const repairs = getFilteredRepairs();
    
    return {
      totalRepairs: repairs.length,
      inProgress: repairs.filter(r => r.status === 'в работе').length,
      completed: repairs.filter(r => r.status === 'завершён').length,
      planned: repairs.filter(r => r.status === 'запланирован').length,
      totalBudget: repairs.reduce((sum, r) => sum + r.budget, 0),
      totalSpent: repairs.reduce((sum, r) => sum + r.spent, 0),
    };
  };

  const stats = getStats();

  const reportTypes = [
    { id: 'repairs', name: 'Отчёт по ремонтам', description: 'Статистика всех ремонтов' },
    { id: 'ships', name: 'Отчёт по судам', description: 'Состояние флота' },
    { id: 'budget', name: 'Бюджетный отчёт', description: 'Расходы и планирование' },
    { id: 'docks', name: 'Отчёт по докам', description: 'Загрузка доков' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Отчёты</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h2 className="font-semibold mb-4">Тип отчёта</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {reportTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => setReportType(type.id as ReportType)}
                  className={`p-4 border rounded-lg text-left transition-all ${
                    reportType === type.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{type.name}</div>
                  <div className="text-sm text-gray-500">{type.description}</div>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="font-semibold mb-4">Параметры отчёта</h2>
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Период</label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as Period)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="week">Неделя</option>
                  <option value="month">Месяц</option>
                  <option value="quarter">Квартал</option>
                  <option value="year">Год</option>
                </select>
              </div>
            </div>
          </Card>

          <div className="flex gap-4">
            <Button onClick={generateReport} disabled={isGenerating}>
              <FileText className="h-4 w-4 mr-2" />
              {isGenerating ? 'Генерация...' : 'Сформировать отчёт'}
            </Button>
            <Button variant="secondary">
              <Download className="h-4 w-4 mr-2" />
              Экспорт
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="font-semibold mb-4">Текущая статистика</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Всего ремонтов</span>
                <span className="font-medium">{stats.totalRepairs}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">В работе</span>
                <span className="font-medium text-blue-600">{stats.inProgress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Завершено</span>
                <span className="font-medium text-green-600">{stats.completed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Запланировано</span>
                <span className="font-medium text-purple-600">{stats.planned}</span>
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between">
                  <span className="text-gray-600">Общий бюджет</span>
                  <span className="font-medium">{stats.totalBudget.toLocaleString()} ₽</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-gray-600">Израсходовано</span>
                  <span className="font-medium">{stats.totalSpent.toLocaleString()} ₽</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}