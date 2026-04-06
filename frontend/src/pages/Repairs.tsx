import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  mockExtendedRepairs,  
  dockNames,
  repairTypes,
  getOverdueRepairs,
  addRepair,
  mockShips
} from '../mock-data/data';
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
  Calendar, 
  Wrench, 
  AlertTriangle,
  TrendingUp,
  Download,
  Plus,
  Ship,
  DollarSign,
  Users,
  BarChart3,
  CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Repairs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('все');
  const [dockFilter, setDockFilter] = useState<string>('все');
  const [typeFilter, setTypeFilter] = useState<string>('все');
  const [priorityFilter, setPriorityFilter] = useState<string>('все');
  const [sortBy, setSortBy] = useState<keyof ExtendedRepair>('startDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showRepairForm, setShowRepairForm] = useState(searchParams.get('new') === 'true');
  
  const handleCloseForm = () => {
    setShowRepairForm(false);
    setSearchParams({});
  };
  
  const handleAddRepair = (repairData: any) => {
    const shipId = parseInt(repairData.shipId);
    const ship = mockShips.find((s) => s.id === shipId);
    
    addRepair({
      shipId: shipId,
      shipName: ship?.name || 'Unknown',
      dock: dockNames[0],
      startDate: repairData.desiredDate || new Date().toISOString().split('T')[0],
      endDate: repairData.desiredDate || new Date().toISOString().split('T')[0],
      status: 'запланирован',
      progress: 0,
      repairType: repairData.repairType as any,
      priority: (repairData.urgency === 'аварийный' ? 'критический' : repairData.urgency === 'срочный' ? 'высокий' : 'средний') as any,
      budget: 0,
      spent: 0,
      manager: 'Диспетчер',
      tasks: [],
      description: repairData.description
    } as any);
    
    setShowRepairForm(false);
    setSearchParams({});
  };

  // Фильтрация и сортировка
  const filteredRepairs = useMemo(() => {
    let result = [...mockExtendedRepairs];
    
    // Поиск
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(repair => 
        repair.shipName.toLowerCase().includes(searchLower) ||
        repair.dock.toLowerCase().includes(searchLower) ||
        repair.manager.toLowerCase().includes(searchLower) ||
        repair.repairType.toLowerCase().includes(searchLower)
      );
    }
    
    // Фильтры
    if (statusFilter !== 'все') {
      result = result.filter(repair => repair.status === statusFilter);
    }
    
    if (dockFilter !== 'все') {
      result = result.filter(repair => repair.dock === dockFilter);
    }
    
    if (typeFilter !== 'все') {
      result = result.filter(repair => repair.repairType === typeFilter);
    }
    
    if (priorityFilter !== 'все') {
      result = result.filter(repair => repair.priority === priorityFilter);
    }
    
    // Сортировка
    result.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortDirection === 'asc' 
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' 
          ? aValue - bValue
          : bValue - aValue;
      }
      
      return 0;
    });
    
    return result;
  }, [search, statusFilter, dockFilter, typeFilter, priorityFilter, sortBy, sortDirection]);

  // Статистика
  const stats = useMemo(() => {
    const total = mockExtendedRepairs.length;
    const inProgress = mockExtendedRepairs.filter(r => r.status === 'в работе').length;
    const planned = mockExtendedRepairs.filter(r => r.status === 'запланирован').length;
    const completed = mockExtendedRepairs.filter(r => r.status === 'завершён').length;
    const overdue = getOverdueRepairs().length;
    const totalBudget = mockExtendedRepairs.reduce((sum, r) => sum + r.budget, 0);
    const totalSpent = mockExtendedRepairs.reduce((sum, r) => sum + r.spent, 0);
    
    return {
      total,
      inProgress,
      planned,
      completed,
      overdue,
      totalBudget,
      totalSpent,
      budgetUtilization: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0
    };
  }, []);

  // Колонки таблицы
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
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="flex items-center">
                {repair.dock}
              </span>
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Прогресс',
      accessor: 'progress' as keyof ExtendedRepair,
      sortable: true,
      align: 'center' as const,
      cell: (value: number, repair: ExtendedRepair) => {
        const getColor = () => {
          if (value >= 80) return 'green';
          if (value >= 50) return 'blue';
          if (value >= 20) return 'orange';
          return 'red';
        };
        
        return (
          <div className="flex flex-col items-center">
            <ProgressCircle 
              progress={value} 
              size={50} 
              color={getColor()}
              showLabel={true}
            />
            <div className="text-xs text-gray-500 mt-1">
              {repair.tasks.filter(t => t.completed).length}/{repair.tasks.length} задач
            </div>
          </div>
        );
      }
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
      )
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
      )
    },
    {
      header: 'Сроки',
      accessor: 'startDate' as keyof ExtendedRepair,
      sortable: true,
      align: 'center' as const,
      cell: (_value: string, repair: ExtendedRepair) => {
        const today = new Date('2025-12-07'); // Фиксированная сегодняшняя дата
        const startDate = new Date(repair.startDate);
        const endDate = new Date(repair.endDate);
        
        // Для завершённых ремонтов
        if (repair.status === 'завершён') {
          const completionDate = repair.actualEndDate ? new Date(repair.actualEndDate) : endDate;
          return (
            <div className="text-center">
              <div className="font-semibold text-gray-900">
                {completionDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
              </div>
              <div className="text-xs">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">
                  Завершён
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {completionDate.getFullYear()}
              </div>
            </div>
          );
        }
        
        // Для ремонтов в работе
        if (repair.status === 'в работе') {
          const isOverdue = endDate < today;
          
          if (isOverdue) {
            const overdueDays = Math.floor((today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
            return (
              <div className="text-center">
                <div className="font-semibold text-red-600">
                  {endDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                </div>
                <div className="text-xs">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-medium">
                    ⚠️ Просрочено на {overdueDays} дн.
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  План: {endDate.getFullYear()}
                </div>
              </div>
            );
          } else {
            const daysLeft = Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return (
              <div className="text-center">
                <div className="font-semibold text-gray-900">
                  {endDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                </div>
                <div className="text-xs">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">
                    Осталось {daysLeft} дн.
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {endDate.getFullYear()}
                </div>
              </div>
            );
          }
        }
        
        // Для запланированных ремонтов
        if (repair.status === 'запланирован') {
          const daysUntilStart = Math.floor((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return (
            <div className="text-center">
              <div className="font-semibold text-gray-900">
                {startDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                {' → '}
                {endDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
              </div>
              <div className="text-xs">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-medium">
                  Начнётся через {daysUntilStart} дн.
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {endDate.getFullYear()}
              </div>
            </div>
          );
        }
        
        // Для других статусов (отменён и т.д.)
        return (
          <div className="text-center">
            <div className="font-semibold text-gray-900">
              {startDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
              {' → '}
              {endDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
            </div>
            <div className="text-xs">
              <StatusBadge status={repair.status} size="sm" />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {endDate.getFullYear()}
            </div>
          </div>
        );
      }
    },
    {
      header: 'Бюджет',
      accessor: 'budget' as keyof ExtendedRepair,
      sortable: true,
      align: 'center' as const,
      cell: (value: number, repair: ExtendedRepair) => (
        <div className="text-center">
          <div className="font-semibold text-gray-900">
            {(value / 1000000).toFixed(1)}M ₽
          </div>
          <div className="text-xs">
            <span className={`font-medium ${repair.spent > value ? 'text-red-600' : 'text-green-600'}`}>
              Израсходовано: {(repair.spent / 1000000).toFixed(1)}M ₽
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
            <div 
              className="bg-blue-600 h-1.5 rounded-full"
              style={{ width: `${Math.min((repair.spent / value) * 100, 100)}%` }}
            />
          </div>
        </div>
      )
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
      )
    }
  ];

  // Обработчик сортировки
  const handleSort = (column: keyof ExtendedRepair) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  // Обработчик клика по строке
  const handleRowClick = (repair: ExtendedRepair) => {
    navigate(`/repairs/${repair.id}`);
  };

  // Уникальные значения для фильтров
  const uniqueStatuses = ['все', ...new Set(mockExtendedRepairs.map(r => r.status))];
  const uniqueDocks = ['все', ...dockNames];
  const uniqueTypes = ['все', ...repairTypes];
  const uniquePriorities = ['все', ...new Set(mockExtendedRepairs.map(r => r.priority))];

  return (
    <div className="space-y-6">
      {/* Заголовок и кнопки */}
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
            Новый ремонт
          </Button>
        </div>
      </div>

      {/* Статистика */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Первые 4 карточки */}
          <Card className="hover:shadow-md transition-shadow">
            <div className="text-center p-4">
              <div className="inline-flex items-center justify-center h-12 w-12 bg-blue-100 rounded-full mb-3">
                <Wrench className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              <p className="text-sm text-gray-600">Всего ремонтов</p>
            </div>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <div className="text-center p-4">
              <div className="inline-flex items-center justify-center h-12 w-12 bg-orange-100 rounded-full mb-3">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-gray-800">{stats.inProgress}</p>
              <p className="text-sm text-gray-600">В работе</p>
            </div>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <div className="text-center p-4">
              <div className="inline-flex items-center justify-center h-12 w-12 bg-purple-100 rounded-full mb-3">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-800">{stats.planned}</p>
              <p className="text-sm text-gray-600">Запланировано</p>
            </div>
          </Card>

          {stats.overdue > 0 ? (
            <Card className="hover:shadow-md transition-shadow">
              <div className="text-center p-4">
                <div className="inline-flex items-center justify-center h-12 w-12 bg-red-100 rounded-full mb-3">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <p className="text-2xl font-bold text-gray-800">{stats.overdue}</p>
                <p className="text-sm text-gray-600">Просрочено</p>
              </div>
            </Card>
          ) : (
            <Card className="hover:shadow-md transition-shadow">
              <div className="text-center p-4">
                <div className="inline-flex items-center justify-center h-12 w-12 bg-green-100 rounded-full mb-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-800">0</p>
                <p className="text-sm text-gray-600">Просроченных</p>
              </div>
            </Card>
          )}

          {/* Бюджет - занимает всю ширину на мобилке, 2 колонки на планшете, 4 на десктопе */}
          <Card className="hover:shadow-md transition-shadow col-span-2 md:col-span-4 lg:col-span-4">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Бюджет ремонтов</p>
                    <p className="text-sm text-gray-600">Использование средств</p>
                  </div>
                </div>
                <span className={`text-sm font-medium px-3 py-1 rounded-full ${stats.budgetUtilization > 90 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {stats.budgetUtilization}% использовано
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 text-start">Выделено</p>
                        <p className="text-lg font-bold text-gray-800 text-start">{(stats.totalBudget / 1000000).toFixed(1)}M ₽</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <BarChart3 className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 text-start">Израсходовано</p>
                        <p className="text-lg font-bold text-gray-800 text-start">{(stats.totalSpent / 1000000).toFixed(1)}M ₽</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="mb-2 flex justify-between">
                    <span className="text-sm font-medium text-gray-700">Прогресс расходов</span>
                    <span className="text-sm text-gray-600">
                      {((stats.totalSpent / stats.totalBudget) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-700"
                      style={{ width: `${stats.budgetUtilization}%` }}
                    />
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <div className="flex justify-between mb-1">
                      <span>Остаток:</span>
                      <span className="font-medium text-green-600">
                        {((stats.totalBudget - stats.totalSpent) / 1000000).toFixed(1)}M ₽
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Эффективность:</span>
                      <span className={`font-medium ${stats.budgetUtilization > 100 ? 'text-red-600' : 'text-green-600'}`}>
                        {stats.budgetUtilization > 100 ? 'Перерасход' : 'В рамках бюджета'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

      {/* Панель фильтров */}
      <Card title="Фильтры и поиск" className="hover:shadow-md transition-shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Поиск */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Поиск
            </label>
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

          {/* Статус */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Статус
            </label>
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

          {/* Док */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Док
            </label>
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

          {/* Тип ремонта */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Тип ремонта
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {uniqueTypes.map((type) => (
                <option key={type} value={type}>
                  {type === 'все' ? 'Все типы' : type}
                </option>
              ))}
            </select>
          </div>

          {/* Приоритет */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Приоритет
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {uniquePriorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priority === 'все' ? 'Все приоритеты' : priority}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Таблица ремонтов */}
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
                setTypeFilter('все');
                setPriorityFilter('все');
              }}
            >
              Сбросить фильтры
            </Button>
          </div>
        }
        className="hover:shadow-md transition-shadow"
      >
        <DataTable
          data={filteredRepairs}
          columns={columns}
          onRowClick={handleRowClick}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSort={handleSort}
          className="mt-4"
          emptyMessage="Не найдено ремонтов по выбранным фильтрам"
        />
      </Card>

      {/* Форма создания ремонта */}
      {showRepairForm && (
        <RepairRequestForm 
          onClose={handleCloseForm}
          onSubmit={handleAddRepair}
        />
      )}
    </div>
  );
}