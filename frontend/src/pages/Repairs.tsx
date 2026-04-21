import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import type { ExtendedRepair } from '../types/repair';
import DataTable from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import PriorityBadge from '../components/ui/PriorityBadge';
import ProgressCircle from '../components/ui/ProgressCircle';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import RepairRequestForm from '../components/forms/RepairRequestForm';
import {
  Search,
  Filter,
  Wrench,
  Download,
  Plus,
  Ship,
  DollarSign,
  Users,
  BarChart3,
} from 'lucide-react';
import { createRepairRequest, getRepairRequests } from '../services/repairRequests';
import { getRepairs } from '../services/repairs';
import { getWorkItems } from '../services/workItems';
import { useAuth } from '../context/AuthContext';
import { getShips } from '../services/ships';

function toDateString(input?: string | null): string {
  if (!input) return new Date().toISOString().slice(0, 10);
  return input.slice(0, 10);
}

export default function Repairs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [repairs, setRepairs] = useState<ExtendedRepair[]>([]);
  const [ships, setShips] = useState<Array<{ id: number; name: string; imo: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('все');
  const [dockFilter, setDockFilter] = useState<string>('все');
  const [sortBy, setSortBy] = useState<keyof ExtendedRepair>('startDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showRepairForm, setShowRepairForm] = useState(searchParams.get('new') === 'true');

  const loadRepairs = async () => {
    setLoading(true);
    setError(null);
    try {
      const [repairsData, requestsData, workItemsData, shipsData] = await Promise.all([
        getRepairs(),
        getRepairRequests(),
        getWorkItems(),
        getShips(),
      ]);

      const requestMap = new Map(requestsData.map((request) => [request.id, request]));

      const mapped = repairsData.map((repair) => {
        const request = requestMap.get(repair.shipId);
        const tasks = workItemsData
          .filter((item) => item.repairId === repair.id)
          .map((item) => ({
            id: item.id,
            name: item.name,
            completed: item.status === 'COMPLETED',
            estimatedHours: item.estimatedHours,
            actualHours: item.actualHours,
            worker: 'Не назначен',
          }));

        return {
          ...repair,
          shipName: request?.shipName ?? repair.shipName,
          repairType: tasks.length > 0 ? 'Текущий ремонт' : 'Доковый ремонт',
          priority: 'средний',
          manager: 'Не назначен',
          startDate: toDateString(repair.actualStartDate ?? repair.startDate),
          endDate: toDateString(repair.actualEndDate ?? repair.endDate),
          tasks,
        } as ExtendedRepair;
      });

      setRepairs(mapped);
      setShips(shipsData.map((ship) => ({ id: ship.id, name: ship.name, imo: ship.imo })));
    } catch {
      setError('Не удалось загрузить ремонты');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRepairs();
  }, []);

  const handleCloseForm = () => {
    setShowRepairForm(false);
    setSearchParams({});
  };

  const handleAddRepairRequest = async (repairData: {
    shipId: string;
    desiredDate?: string;
    description: string;
  }) => {
    const shipId = Number(repairData.shipId);
    if (!shipId) return;

    setError(null);
    try {
      await createRepairRequest({
        shipId,
        clientId: user?.id ?? 1,
        requestedStartDate: repairData.desiredDate || null,
        description: repairData.description,
        status: 'SUBMITTED',
      });

      setShowRepairForm(false);
      setSearchParams({});
      await loadRepairs();
    } catch {
      setError('Не удалось создать заявку на ремонт');
    }
  };

  const filteredRepairs = useMemo(() => {
    let result = [...repairs];
    if (search) {
      const normalizedSearch = search.toLowerCase();
      result = result.filter(
        (repair) =>
          repair.shipName.toLowerCase().includes(normalizedSearch) ||
          repair.dock.toLowerCase().includes(normalizedSearch) ||
          repair.manager.toLowerCase().includes(normalizedSearch)
      );
    }
    if (statusFilter !== 'все') {
      result = result.filter((repair) => repair.status === statusFilter);
    }
    if (dockFilter !== 'все') {
      result = result.filter((repair) => repair.dock === dockFilter);
    }

    result.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      return 0;
    });
    return result;
  }, [repairs, search, statusFilter, dockFilter, sortBy, sortDirection]);

  const stats = useMemo(() => {
    const total = repairs.length;
    const inProgress = repairs.filter((repair) => repair.status === 'в работе').length;
    const planned = repairs.filter((repair) => repair.status === 'запланирован').length;
    const completed = repairs.filter((repair) => repair.status === 'завершён').length;
    const totalBudget = repairs.reduce((sum, repair) => sum + repair.budget, 0);
    const totalSpent = repairs.reduce((sum, repair) => sum + repair.spent, 0);
    return {
      total,
      inProgress,
      planned,
      completed,
      totalBudget,
      totalSpent,
      budgetUtilization: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
    };
  }, [repairs]);

  const columns = [
    {
      header: 'Судно / Док',
      accessor: 'shipName' as keyof ExtendedRepair,
      sortable: true,
      cell: (value: string, repair: ExtendedRepair) => (
        <div className="flex items-center">
          <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
            <Ship className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{value}</p>
            <p className="text-sm text-gray-600">{repair.dock}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Прогресс',
      accessor: 'progress' as keyof ExtendedRepair,
      sortable: true,
      align: 'center' as const,
      cell: (value: number, repair: ExtendedRepair) => (
        <div className="flex flex-col items-center">
          <ProgressCircle progress={value} size={50} color={value >= 80 ? 'green' : value >= 50 ? 'blue' : 'orange'} showLabel />
          <div className="text-xs text-gray-500 mt-1">
            {repair.tasks.filter((task) => task.completed).length}/{repair.tasks.length} задач
          </div>
        </div>
      ),
    },
    {
      header: 'Тип / Приоритет',
      accessor: 'repairType' as keyof ExtendedRepair,
      sortable: true,
      cell: (value: string, repair: ExtendedRepair) => (
        <div className="space-y-2">
          <div className="font-medium text-gray-900">{value}</div>
          <PriorityBadge priority={repair.priority} size="sm" />
        </div>
      ),
    },
    {
      header: 'Статус',
      accessor: 'status' as keyof ExtendedRepair,
      sortable: true,
      align: 'center' as const,
      cell: (value: string) => (
        <div className="flex justify-center">
          <StatusBadge status={value} size="sm" />
        </div>
      ),
    },
    {
      header: 'Сроки',
      accessor: 'startDate' as keyof ExtendedRepair,
      sortable: true,
      align: 'center' as const,
      cell: (_value: string, repair: ExtendedRepair) => (
        <div className="text-center">
          <div className="font-semibold text-gray-900">
            {new Date(repair.startDate).toLocaleDateString('ru-RU')} → {new Date(repair.endDate).toLocaleDateString('ru-RU')}
          </div>
        </div>
      ),
    },
    {
      header: 'Бюджет',
      accessor: 'budget' as keyof ExtendedRepair,
      sortable: true,
      align: 'center' as const,
      cell: (value: number, repair: ExtendedRepair) => (
        <div className="text-center">
          <div className="font-semibold text-gray-900">{(value / 1000000).toFixed(1)}M ₽</div>
          <div className="text-xs text-gray-600">Израсходовано: {(repair.spent / 1000000).toFixed(1)}M ₽</div>
        </div>
      ),
    },
    {
      header: 'Менеджер',
      accessor: 'manager' as keyof ExtendedRepair,
      sortable: true,
      cell: (value: string) => (
        <div className="flex items-center">
          <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          <span className="font-medium text-gray-900">{value}</span>
        </div>
      ),
    },
  ];

  const handleSort = (column: keyof ExtendedRepair) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  const handleRowClick = (repair: ExtendedRepair) => {
    navigate(`/repairs/${repair.id}`);
  };

  const uniqueStatuses = ['все', ...new Set(repairs.map((repair) => repair.status))];
  const uniqueDocks = ['все', ...new Set(repairs.map((repair) => repair.dock))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <Wrench className="h-6 w-6 mr-2 text-blue-500" />
            Ремонты
          </h1>
          <p className="text-gray-600">Управление и отслеживание ремонтных работ</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" icon={Download}>
            Экспорт
          </Button>
          <Button variant="primary" icon={Plus} onClick={() => setShowRepairForm(true)}>
            Новая заявка
          </Button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}
      {loading && <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">Загрузка...</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center p-4">
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            <p className="text-sm text-gray-600">Всего ремонтов</p>
          </div>
        </Card>
        <Card>
          <div className="text-center p-4">
            <p className="text-2xl font-bold text-gray-800">{stats.inProgress}</p>
            <p className="text-sm text-gray-600">В работе</p>
          </div>
        </Card>
        <Card>
          <div className="text-center p-4">
            <p className="text-2xl font-bold text-gray-800">{stats.planned}</p>
            <p className="text-sm text-gray-600">Запланировано</p>
          </div>
        </Card>
        <Card>
          <div className="text-center p-4">
            <p className="text-2xl font-bold text-gray-800">{stats.completed}</p>
            <p className="text-sm text-gray-600">Завершено</p>
          </div>
        </Card>
      </div>

      <Card title="Фильтры и поиск">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Поиск</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Судно, док, менеджер..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Статус</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {uniqueStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status === 'все' ? 'Все статусы' : status}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Док</label>
            <select
              value={dockFilter}
              onChange={(e) => setDockFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {uniqueDocks.map((dock) => (
                <option key={dock} value={dock}>
                  {dock === 'все' ? 'Все доки' : dock}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card
        title={`Ремонты (${filteredRepairs.length})`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('');
                setStatusFilter('все');
                setDockFilter('все');
              }}
            >
              Сбросить фильтры
            </Button>
          </div>
        }
      >
        <DataTable
          data={filteredRepairs}
          columns={columns}
          onRowClick={handleRowClick}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSort={handleSort}
          className="mt-4"
          emptyMessage="Не найдено ремонтов"
        />
      </Card>

      <Card>
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-700">
            <DollarSign className="h-5 w-5 text-green-600" />
            <span>Бюджет: {(stats.totalBudget / 1000000).toFixed(1)}M ₽</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <span>Использование: {stats.budgetUtilization}%</span>
          </div>
        </div>
      </Card>

      {showRepairForm && (
        <RepairRequestForm
          onClose={handleCloseForm}
          onSubmit={handleAddRepairRequest}
          ships={ships}
        />
      )}
    </div>
  );
}
