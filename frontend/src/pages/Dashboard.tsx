import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import KPICard from '../components/ui/KPICard';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { FileDown, CalendarPlus, Ship, Wrench, MapPin, User, ClipboardList, Anchor, Download } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { CheckCircle } from 'lucide-react';
import { getRepairs } from '../services/repairs';
import { getRepairRequests } from '../services/repairRequests';
import { getWorkItems } from '../services/workItems';
import { getDocks } from '../services/docks';

interface QuickAction {
  label: string;
  icon: LucideIcon;
  navigateTo: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Добавить судно', icon: Ship, navigateTo: '/ships?new=true' },
  { label: 'Запланировать ремонт', icon: CalendarPlus, navigateTo: '/repairs?new=true' },
  { label: 'Создать отчёт', icon: FileDown, navigateTo: '/reports' },
  { label: 'Экспорт данных', icon: Download, navigateTo: '/reports?export=true' },
  { label: 'Мои задачи', icon: ClipboardList, navigateTo: '/tasks' },
  { label: 'Мой док', icon: Anchor, navigateTo: '/my-dock' },
  { label: 'Мои суда', icon: Ship, navigateTo: '/ships' },
];

const ACTIONS_BY_ROLE: Record<string, string[]> = {
  admin: ['Добавить судно', 'Создать отчёт', 'Экспорт данных'],
  dispatcher: ['Запланировать ремонт', 'Создать отчёт', 'Мои задачи'],
  operator: ['Мой док', 'Создать отчёт'],
  master: ['Мои задачи', 'Создать отчёт'],
  worker: ['Мои задачи'],
  client: ['Мои суда', 'Запланировать ремонт'],
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repairs, setRepairs] = useState<Awaited<ReturnType<typeof getRepairs>>>([]);
  const [repairRequestsCount, setRepairRequestsCount] = useState(0);
  const [workItemsCount, setWorkItemsCount] = useState(0);
  const [docksCount, setDocksCount] = useState(0);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const [repairsData, repairRequestsData, workItemsData, docksData] = await Promise.all([
          getRepairs(),
          getRepairRequests(),
          getWorkItems(),
          getDocks(),
        ]);
        setRepairs(repairsData);
        setRepairRequestsCount(repairRequestsData.length);
        setWorkItemsCount(workItemsData.length);
        setDocksCount(docksData.length);
      } catch {
        setError('Не удалось загрузить данные дашборда');
      } finally {
        setLoading(false);
      }
    };

    void loadDashboard();
  }, []);

  const activeRepairs = useMemo(
    () => repairs.filter((repair) => repair.status === 'в работе' || repair.status === 'запланирован'),
    [repairs]
  );

  const kpis = useMemo(
    () => [
      {
        title: 'Активные ремонты',
        value: activeRepairs.length,
        change: 0,
        icon: 'wrench',
        color: 'blue' as const,
        description: 'Запланированные и выполняемые',
      },
      {
        title: 'Заявки на ремонт',
        value: repairRequestsCount,
        change: 0,
        icon: 'clipboard',
        color: 'orange' as const,
        description: 'Всего заявок',
      },
      {
        title: 'Работы',
        value: workItemsCount,
        change: 0,
        icon: 'check-circle',
        color: 'green' as const,
        description: 'Work items в системе',
      },
      {
        title: 'Доки',
        value: docksCount,
        change: 0,
        icon: 'anchor',
        color: 'blue' as const,
        description: 'Доступные производственные ресурсы',
      },
    ],
    [activeRepairs.length, repairRequestsCount, workItemsCount, docksCount]
  );

  const userRole = user?.role || 'client';
  const allowedActions = ACTIONS_BY_ROLE[userRole] || [];
  const quickActions = QUICK_ACTIONS.filter((action) => allowedActions.includes(action.label));

  const handleAction = (navigateTo: string) => {
    const path = navigateTo.split('?')[0];
    navigate(path);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 text-start">Дашборд</h1>
          <p className="text-gray-600 text-start">Обзор состояния ремонтов и судов</p>
        </div>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('ru-RU', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}
      {loading && <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">Загрузка...</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi, index) => (
          <div key={index} className="h-full transform transition-transform duration-300 hover:scale-[1.02]">
            <KPICard
              title={kpi.title}
              value={kpi.value}
              change={kpi.change}
              icon={kpi.icon}
              color={kpi.color}
              description={kpi.description}
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="card hover:shadow-md transition-shadow duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
              <div className="w-full sm:w-auto">
                <h2 className="text-xl font-bold text-gray-800 flex items-center justify-center sm:justify-start">
                  <Wrench className="h-5 w-5 mr-2 text-blue-500 hidden sm:block" />
                  Активные ремонты
                </h2>
                <p className="text-gray-600 text-sm mt-1 hidden sm:block">Текущие работы в доках</p>
              </div>
              <span className="text-sm font-medium bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full self-center sm:self-auto">
                {activeRepairs.length} активных
              </span>
            </div>

            {activeRepairs.length > 0 ? (
              <div className="space-y-4">
                {activeRepairs.slice(0, 6).map((repair) => (
                  <div
                    key={repair.id}
                    className="border border-gray-200 rounded-xl p-4 sm:p-5 hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-300 group cursor-pointer"
                    onClick={() => navigate(`/repairs/${repair.id}`)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors text-start">
                          {repair.shipName}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mt-1">
                          <span className="flex items-center whitespace-nowrap">
                            <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                            Док {repair.dock}
                          </span>
                          <span className="hidden sm:inline">•</span>
                          <span className="flex items-center whitespace-nowrap">
                            <User className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                            {repair.manager}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="flex flex-col sm:flex-row sm:justify-between text-sm text-gray-600 mb-1.5 gap-1">
                        <span>Прогресс</span>
                        <span className="font-medium">{repair.progress}% завершено</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${repair.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <div className="inline-flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 bg-green-100 rounded-full mb-4">
                  <CheckCircle className="h-7 w-7 sm:h-8 sm:w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Нет активных ремонтов</h3>
                <p className="text-gray-600 max-w-sm mx-auto px-4 sm:px-0">Все суда в строю. Отличная работа!</p>
              </div>
            )}
          </div>
        </Card>

        <Card title="Финансовая сводка">
          <div className="space-y-3">
            {repairs.slice(0, 5).map((repair) => {
              const efficiency = repair.budget > 0 ? Math.round((repair.spent / repair.budget) * 100) : 0;
              return (
                <div key={repair.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{repair.shipName}</p>
                    <p className="text-sm text-gray-600">{repair.repairType}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${efficiency <= 100 ? 'text-green-600' : 'text-red-600'}`}>
                      {efficiency}%
                    </div>
                    <div className="text-xs text-gray-500">использования бюджета</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm" className="w-full">
              Подробная статистика
            </Button>
          </div>
        </Card>
      </div>

      {quickActions.length > 0 && (
        <Card title="Быстрые действия" className="mt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant={index === 0 ? 'primary' : 'secondary'}
                icon={action.icon}
                onClick={() => handleAction(action.navigateTo)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
