import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { mockShips, addShip } from '../mock-data/data';
import type { Ship } from '../types/repair';
import DataTable from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import ShipForm from '../components/forms/ShipForm';
import { Search, Filter, Ship as ShipIcon, Plus, Download } from 'lucide-react';

export default function Ships() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('все');
  const [sortBy, setSortBy] = useState<keyof Ship>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showShipForm, setShowShipForm] = useState(searchParams.get('new') === 'true');
  
  // Закрыть форму и убрать параметр из URL
  const handleCloseForm = () => {
    setShowShipForm(false);
    setSearchParams({});
  };
  
  // Обработчик успешного добавления судна
  const handleAddShip = (shipData: Omit<Ship, 'id'>) => {
    addShip(shipData);
    setShowShipForm(false);
    setSearchParams({});
  };
  
  // Фильтрация и сортировка данных
  const filteredShips = useMemo(() => {
    let result = [...mockShips];
    
    // Поиск по имени и IMO
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(ship => 
        ship.name.toLowerCase().includes(searchLower) ||
        ship.imo.toLowerCase().includes(searchLower) ||
        ship.owner.toLowerCase().includes(searchLower)
      );
    }
    
    // Фильтр по статусу
    if (statusFilter !== 'все') {
      result = result.filter(ship => ship.status === statusFilter);
    }
    
    // Сортировка
    result.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return sortDirection === 'asc' 
        ? Number(aValue) - Number(bValue)
        : Number(bValue) - Number(aValue);
    });
    
    return result;
  }, [search, statusFilter, sortBy, sortDirection]);

  // Колонки таблицы
  // В колонках таблицы замени на:
  const columns = [
    {
      header: 'Название',
      accessor: 'name' as keyof Ship,
      sortable: true,
      cell: (value: string, ship: Ship) => (
        <div className="flex items-center">
          <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
            <ShipIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500">IMO: {ship.imo}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Тип',
      accessor: 'type' as keyof Ship,
      sortable: true,
      align: 'center' as const,
      cell: (value: string) => (
        <div className="text-center font-medium text-gray-900">
          {value}
        </div>
      )
    },
    {
      header: 'Статус',
      accessor: 'status' as keyof Ship,
      sortable: true,
      align: 'center' as const,
      cell: (value: string) => (
        <div className="flex justify-center">
          <StatusBadge status={value} size="sm" />
        </div>
      )
    },
    {
      header: 'Год постройки',
      accessor: 'buildYear' as keyof Ship,
      sortable: true,
      align: 'center' as const,
      cell: (value: number) => (
        <div className="text-center">
          <span className="inline-flex items-center justify-center h-8 w-8 bg-blue-50 rounded-full font-semibold text-blue-700">
            {value}
          </span>
        </div>
      )
    },
    {
      header: 'Владелец',
      accessor: 'owner' as keyof Ship,
      sortable: true,
      cell: (value: string) => (
        <div className="font-medium text-gray-900">
          {value}
        </div>
      )
    },
    {
      header: 'Следующий ремонт',
      accessor: 'nextRepairDate' as keyof Ship,
      sortable: true,
      align: 'center' as const,
      cell: (value: string) => {
        const date = new Date(value);
        const isSoon = date.getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000; // 30 дней
        
        return (
          <div className="text-center">
            <div className={`font-semibold ${isSoon ? 'text-orange-600' : 'text-gray-900'}`}>
              {date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
            </div>
            <div className="text-xs text-gray-500">
              {date.getFullYear()}
            </div>
          </div>
        );
      }
    }
  ];
  // Уникальные статусы для фильтра
  const uniqueStatuses = ['все', ...new Set(mockShips.map(ship => ship.status))];

  // Обработчик сортировки
  const handleSort = (column: keyof Ship) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  // Обработчик клика по строке
  const handleRowClick = (ship: Ship) => {
    navigate(`/ships/${ship.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Заголовок и кнопки */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Суда</h1>
          <p className="text-gray-600">Управление флотом и планирование ремонтов</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" icon={Download}>
            Экспорт
          </Button>
          <Button variant="primary" icon={Plus} onClick={() => setShowShipForm(true)}>
            Добавить судно
          </Button>
        </div>
      </div>

      {/* Панель фильтров и поиска */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Поиск */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Поиск судна
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Название, IMO, владелец..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Фильтр по статусу */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Статус
            </label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                {uniqueStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Статистика */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Статистика
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">{mockShips.length}</p>
                <p className="text-sm text-blue-800">Всего</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {mockShips.filter(s => s.status === 'в ремонте').length}
                </p>
                <p className="text-sm text-orange-800">В ремонте</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-600">
                  {mockShips.filter(s => s.status === 'в плавании').length}
                </p>
                <p className="text-sm text-green-800">В плавании</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Таблица судов */}
      <Card title={`Суда (${filteredShips.length})`}>
        <DataTable
          data={filteredShips}
          columns={columns}
          onRowClick={handleRowClick}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSort={handleSort}
          className="mt-4"
        />
      </Card>

      {/* Легенда статусов */}
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Легенда статусов:</p>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status="в ремонте" />
          <StatusBadge status="ожидает" />
          <StatusBadge status="в плавании" />
          <StatusBadge status="в работе" />
          <StatusBadge status="запланирован" />
          <StatusBadge status="завершён" />
        </div>
      </div>

      {/* Форма добавления судна */}
      {showShipForm && (
        <ShipForm 
          onClose={handleCloseForm}
          onSubmit={handleAddShip}
        />
      )}
    </div>
  );
}