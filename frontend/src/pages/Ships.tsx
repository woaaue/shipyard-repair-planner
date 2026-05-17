import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import type { Ship } from '../types/repair';
import DataTable from '../components/ui/DataTable';
import Button from '../components/ui/Button';
import ShipForm from '../components/forms/ShipForm';
import { Search, Filter, Ship as ShipIcon, Plus } from 'lucide-react';
import { createShip, getShips } from '../services/ships';
import { useAuth } from '../context/AuthContext';
import V7StateText from '../components/v7/V7StateText';
import V7PageHeader from '../components/v7/V7PageHeader';
import V7Panel from '../components/v7/V7Panel';
import V7PanelTitle from '../components/v7/V7PanelTitle';

export default function Ships() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [ships, setShips] = useState<Ship[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('все');
  const [sortBy, setSortBy] = useState<keyof Ship>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showShipForm, setShowShipForm] = useState(searchParams.get('new') === 'true');

  const fetchShips = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getShips({ search, status: statusFilter });
      const scopedData =
        user?.role === 'client' && typeof user.id === 'number'
          ? data.filter((ship) => ship.ownerId === user.id)
          : data;
      setShips(scopedData);
    } catch {
      setError('Не удалось загрузить суда');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchShips();
  }, [user?.id, user?.role]);

  const handleCloseForm = () => {
    setShowShipForm(false);
    setSearchParams({});
  };

  const handleAddShip = async (shipData: Parameters<typeof createShip>[0]) => {
    await createShip(shipData);
    await fetchShips();
    setShowShipForm(false);
    setSearchParams({});
  };

  const filteredShips = useMemo(() => {
    let result = [...ships];

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(ship =>
        ship.name.toLowerCase().includes(searchLower) ||
        ship.imo.toLowerCase().includes(searchLower) ||
        ship.owner.toLowerCase().includes(searchLower)
      );
    }

    if (statusFilter !== 'все') {
      result = result.filter(ship => ship.status === statusFilter);
    }

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
  }, [ships, search, statusFilter, sortBy, sortDirection]);

  const columns = [
    {
      header: 'Название',
      accessor: 'name' as keyof Ship,
      sortable: true,
      cell: (value: string, ship: Ship) => (
        <div className="flex items-center">
          <div className="h-10 w-10 bg-[var(--soft)] border border-[var(--line)] rounded-lg flex items-center justify-center mr-3">
            <ShipIcon className="h-5 w-5 text-[var(--ink)]" />
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
      cell: (value: string) => <div className="text-center font-medium text-gray-900">{value}</div>
    },
    {
      header: 'Статус',
      accessor: 'status' as keyof Ship,
      sortable: true,
      align: 'center' as const,
      cell: (value: string) => (
        <div className="flex justify-center"><V7StateText value={String(value).toUpperCase()} /></div>
      )
    },
    {
      header: 'Владелец',
      accessor: 'owner' as keyof Ship,
      sortable: true,
      cell: (value: string) => <div className="font-medium text-gray-900">{value}</div>
    },
    {
      header: 'Обновлено',
      accessor: 'nextRepairDate' as keyof Ship,
      sortable: true,
      align: 'center' as const,
      cell: (value: string) => {
        const date = new Date(value);
        return (
          <div className="text-center">
            <div className="font-semibold text-gray-900">
              {Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
            </div>
            <div className="text-xs text-gray-500">{Number.isNaN(date.getTime()) ? '' : date.getFullYear()}</div>
          </div>
        );
      }
    }
  ];

  const uniqueStatuses = ['все', ...new Set(ships.map(ship => ship.status))];

  const handleSort = (column: keyof Ship) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  const handleRowClick = (ship: Ship) => {
    navigate(`/ships/${ship.id}`);
  };

  const canCreateShip = user?.role === 'admin' || user?.role === 'client';

  return (
    <div className="space-y-6">
      <V7PageHeader
        title="Суда"
        description="Управление флотом и планирование ремонтов"
        actions={
          <>
            {canCreateShip && (
              <Button variant="primary" icon={Plus} onClick={() => setShowShipForm(true)}>
                Добавить судно
              </Button>
            )}
          </>
        }
      />

      {error && (
        <div className="px-4 py-3 rounded-lg border bg-[var(--danger-bg)] border-[var(--danger-line)] text-[var(--danger-ink)]">{error}</div>
      )}
      {isLoading && (
        <div className="px-4 py-3 rounded-lg border bg-[var(--soft)] border-[var(--line)] text-[var(--muted)]">Загрузка судов...</div>
      )}

      <V7Panel>
        <V7PanelTitle title="Фильтры и поиск" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-2">Поиск судна</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--muted)] h-5 w-5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Название, IMO, владелец..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-2">Статус</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--muted)] h-5 w-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)] appearance-none"
              >
                {uniqueStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-2">Сводка</label>
            <div className="rounded-lg border border-[var(--line)] bg-[var(--soft)] px-3 py-2 text-sm text-[var(--muted)]">
              Всего: {ships.length} · В ремонте: {ships.filter((s) => s.status === 'в ремонте').length} · В плавании:{' '}
              {ships.filter((s) => s.status === 'в плавании').length}
            </div>
          </div>
        </div>
      </V7Panel>

      <V7Panel>
        <V7PanelTitle title={`Суда (${filteredShips.length})`} />
        <DataTable
          data={filteredShips}
          columns={columns}
          onRowClick={handleRowClick}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSort={handleSort}
          className="mt-4"
        />
      </V7Panel>

      {showShipForm && (
        <ShipForm
          onClose={handleCloseForm}
          onSubmit={handleAddShip}
        />
      )}
    </div>
  );
}

