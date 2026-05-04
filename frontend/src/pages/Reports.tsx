import { useEffect, useMemo, useState } from 'react';
import { FileText, Download } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { getRepairs } from '../services/repairs';
import { getSubordinates } from '../services/users';
import type { ExtendedRepair } from '../types/repair';

type ReportType = 'repairs' | 'ships' | 'budget' | 'docks';
type Period = 'week' | 'month' | 'quarter' | 'year';

export default function Reports() {
  const { user } = useAuth();
  const [reportType, setReportType] = useState<ReportType>('repairs');
  const [period, setPeriod] = useState<Period>('month');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [repairs, setRepairs] = useState<ExtendedRepair[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRepairs = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const baseRepairs =
          user?.role === 'operator' && typeof user.id === 'number'
            ? await getRepairs({ operatorId: user.id })
            : await getRepairs();

        if (user?.role === 'dispatcher' && typeof user.id === 'number') {
          const subordinates = await getSubordinates(user.id);
          const operatorIds = new Set(subordinates.filter((member) => member.role === 'operator').map((member) => member.id));
          setRepairs(baseRepairs.filter((repair) => typeof repair.operatorId === 'number' && operatorIds.has(repair.operatorId)));
        } else {
          setRepairs(baseRepairs);
        }
      } catch {
        setError('Не удалось загрузить данные для отчетов.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadRepairs();
  }, [user?.id, user?.role]);

  const filteredRepairs = useMemo(() => {
    let current = [...repairs];

    if (user?.role === 'client' && user.shipId) {
      current = current.filter((repair) => repair.shipId === user.shipId);
    }

    return current;
  }, [repairs, user]);

  const stats = useMemo(() => {
    const totalBudget = filteredRepairs.reduce((sum, repair) => sum + (repair.budget ?? 0), 0);
    const totalSpent = filteredRepairs.reduce((sum, repair) => sum + (repair.spent ?? 0), 0);

    return {
      totalRepairs: filteredRepairs.length,
      inProgress: filteredRepairs.filter((repair) => repair.progress > 0 && repair.progress < 100).length,
      completed: filteredRepairs.filter((repair) => repair.progress >= 100).length,
      planned: filteredRepairs.filter((repair) => repair.progress <= 0).length,
      totalBudget,
      totalSpent,
    };
  }, [filteredRepairs]);

  const generateReport = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      window.alert(`Отчет сформирован: ${reportType}, период ${period}.`);
    }, 1000);
  };

  const reportTypes = [
    { id: 'repairs', name: 'Отчет по ремонтам', description: 'Текущие и завершенные ремонты' },
    { id: 'ships', name: 'Отчет по судам', description: 'Состояние флота и активность судов' },
    { id: 'budget', name: 'Отчет по бюджету', description: 'Затраты и использование бюджета' },
    { id: 'docks', name: 'Отчет по докам', description: 'Загрузка и использование доков' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Отчеты</h1>
      </div>

      {error && <Card><div className="text-red-600">{error}</div></Card>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h2 className="font-semibold mb-4">Тип отчета</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {reportTypes.map((type) => (
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
            <h2 className="font-semibold mb-4">Параметры отчета</h2>
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
            <Button onClick={generateReport} disabled={isGenerating || isLoading}>
              <FileText className="h-4 w-4 mr-2" />
              {isGenerating ? 'Формирование...' : 'Сформировать отчет'}
            </Button>
            <Button variant="secondary" disabled={isLoading}>
              <Download className="h-4 w-4 mr-2" />
              Экспорт
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="font-semibold mb-4">Текущая статистика</h3>
            {isLoading ? (
              <div className="text-gray-500">Загрузка...</div>
            ) : (
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
                    <span className="text-gray-600">Фактические затраты</span>
                    <span className="font-medium">{stats.totalSpent.toLocaleString()} ₽</span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
