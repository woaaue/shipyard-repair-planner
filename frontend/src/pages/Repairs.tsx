import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import type { ExtendedRepair } from '../types/repair';
import DataTable from '../components/ui/DataTable';
import ProgressCircle from '../components/ui/ProgressCircle';
import Button from '../components/ui/Button';
import RepairRequestForm, { type RepairRequestFormData } from '../components/forms/RepairRequestForm';
import {
  Search,
  Filter,
  Plus,
  Ship,
  Users,
} from 'lucide-react';
import { acceptRepairRequestByClient, createRepairRequest, getRepairRequests } from '../services/repairRequests';
import { getRepairs, updateRepairOperator } from '../services/repairs';
import { getWorkItems } from '../services/workItems';
import { useAuth } from '../context/AuthContext';
import { createShip, getShips } from '../services/ships';
import { getSubordinates } from '../services/users';
import { REPAIR_REQUEST_STATUS_LABELS, WORK_REVIEW_STATUS_LABELS } from '../constants/labels';
import V7PageHeader from '../components/v7/V7PageHeader';
import V7Panel from '../components/v7/V7Panel';
import V7PanelTitle from '../components/v7/V7PanelTitle';
import V7StateText from '../components/v7/V7StateText';
import { formatDateRangeRu, normalizeDateOnly } from '../utils/repairDates';

function toDateString(input?: string | null): string {
  return normalizeDateOnly(input) ?? '';
}

export default function Repairs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [repairs, setRepairs] = useState<ExtendedRepair[]>([]);
  const [ships, setShips] = useState<Array<{ id: number; name: string; imo: string }>>([]);
  const [operators, setOperators] = useState<Array<{ id: number; fullName: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('все');
  const [dockFilter, setDockFilter] = useState<string>('все');
  const [showOnlyUnassigned, setShowOnlyUnassigned] = useState(false);
  const [showReadyForAcceptanceOnly, setShowReadyForAcceptanceOnly] = useState(false);
  const [acceptingRepairRequestId, setAcceptingRepairRequestId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<keyof ExtendedRepair>('startDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showRepairForm, setShowRepairForm] = useState(searchParams.get('new') === 'true');

  const loadRepairs = async () => {
    setLoading(true);
    setError(null);
    try {
      const repairFilters =
        user?.role === 'operator' && typeof user.id === 'number'
          ? { operatorId: user.id }
          : undefined;
      const requestFilters =
        user?.role === 'client' && typeof user.id === 'number'
          ? { clientId: user.id }
          : undefined;

      const [repairsData, requestsData, workItemsData, shipsData] = await Promise.all([
        getRepairs(repairFilters),
        getRepairRequests(requestFilters),
        getWorkItems(),
        getShips(),
      ]);

      const requestMap = new Map(requestsData.map((request) => [request.id, request]));
      const subordinateOperators =
        user?.role === 'dispatcher' && typeof user.id === 'number'
          ? (await getSubordinates(user.id)).filter((member) => member.role === 'operator')
          : [];
      const scopedRepairs =
        user?.role === 'client'
          ? repairsData.filter((repair) => requestMap.has(repair.shipId))
          : repairsData;

      const mapped = scopedRepairs.map((repair) => {
        const request = requestMap.get(repair.shipId);
        const tasks = workItemsData
          .filter((item) => item.repairId === repair.id)
          .map((item) => ({
            id: item.id,
            name: item.name,
            completed: item.reviewStatus === 'APPROVED',
            estimatedHours: item.estimatedHours,
            actualHours: item.actualHours,
            worker: item.assigneeFullName || 'Не назначен',
            reviewStatus: item.reviewStatus,
          }));

        const completedTasks = tasks.filter((task) => task.completed).length;
        let progressFromTasks =
          tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : repair.progress;

        if (repair.status === 'завершён') {
          progressFromTasks = 100;
        }

        if (repair.status === 'отменён') {
          progressFromTasks = 0;
        }

        return {
          ...repair,
          shipName: request?.shipName ?? repair.shipName,
          repairType: tasks.length > 0 ? 'Текущий ремонт' : 'Доковый ремонт',
          priority: 'средний',
          manager: repair.operatorFullName ?? 'Не назначен',
          requestStatus: request?.status ?? undefined,
          clientAccepted: request?.clientAccepted ?? false,
          acceptanceAction: '',
          startDate: toDateString(
            repair.actualStartDate ?? repair.startDate ?? request?.scheduledStartDate ?? request?.requestedStartDate
          ),
          endDate: toDateString(
            repair.actualEndDate ?? repair.endDate ?? request?.scheduledEndDate ?? request?.requestedEndDate
          ),
          plannedStartDate: toDateString(request?.scheduledStartDate ?? request?.requestedStartDate),
          plannedEndDate: toDateString(request?.scheduledEndDate ?? request?.requestedEndDate),
          progress: progressFromTasks,
          tasks,
        } as ExtendedRepair;
      });

      setRepairs(mapped);
      setShips(shipsData.map((ship) => ({ id: ship.id, name: ship.name, imo: ship.imo })));
      setOperators(subordinateOperators.map((operator) => ({ id: operator.id, fullName: operator.fullName })));
    } catch {
      setError('Не удалось загрузить ремонты');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRepairs();
  }, [user?.id, user?.role]);

  const handleAssignOperator = async (repairId: number, operatorIdRaw: string) => {
    setError(null);
    try {
      const operatorId = operatorIdRaw ? Number(operatorIdRaw) : null;
      await updateRepairOperator(repairId, operatorId);
      await loadRepairs();
    } catch {
      setError('Не удалось назначить оператора');
    }
  };

  const handleCloseForm = () => {
    setShowRepairForm(false);
    setSearchParams({});
  };

  const handleAddRepairRequest = async (repairData: RepairRequestFormData) => {
    if (!user?.id) {
      setError('Не удалось определить пользователя для создания заявки');
      throw new Error('User is not defined');
    }

    setError(null);
    try {
      let shipId = repairData.mode === 'existing' ? Number(repairData.shipId) : 0;

      if (repairData.mode === 'new') {
        const createdShip = await createShip({
          name: repairData.newShip.name,
          imo: repairData.newShip.imo,
          type: repairData.newShip.type,
          status: 'ожидает',
          ownerId: user.id,
          length: Number(repairData.newShip.length),
          width: Number(repairData.newShip.width),
          draft: Number(repairData.newShip.draft),
        });
        shipId = createdShip.id;
      }

      if (!shipId) return;

      await createRepairRequest({
        shipId,
        clientId: user.id,
        requestedStartDate: repairData.desiredDate || null,
        description: repairData.description,
        status: 'SUBMITTED',
      });

      setShowRepairForm(false);
      setSearchParams({});
      await loadRepairs();
    } catch (error) {
      setError('Не удалось создать заявку на ремонт');
      throw error;
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
    if (user?.role === 'dispatcher' && showOnlyUnassigned) {
      result = result.filter((repair) => !repair.operatorId);
    }
    if (user?.role === 'client' && showReadyForAcceptanceOnly) {
      result = result.filter(
        (repair) =>
          repair.status === 'завершён' &&
          !repair.clientAccepted &&
          repair.tasks.length > 0 &&
          repair.tasks.every((task) => task.reviewStatus === 'APPROVED')
      );
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
  }, [
    repairs,
    search,
    statusFilter,
    dockFilter,
    showOnlyUnassigned,
    showReadyForAcceptanceOnly,
    sortBy,
    sortDirection,
    user?.role,
  ]);

  const stats = useMemo(() => {
    const total = repairs.length;
    const inProgress = repairs.filter((repair) => repair.status === 'в работе').length;
    const planned = repairs.filter((repair) => repair.status === 'запланирован').length;
    const completed = repairs.filter((repair) => repair.status === 'завершён').length;
    const unassignedOperators = repairs.filter((repair) => !repair.operatorId).length;
    const readyForAcceptance = repairs.filter(
      (repair) =>
        repair.status === 'завершён' &&
        !repair.clientAccepted &&
        repair.tasks.length > 0 &&
        repair.tasks.every((task) => task.reviewStatus === 'APPROVED')
    ).length;
    return {
      total,
      inProgress,
      planned,
      completed,
      unassignedOperators,
      readyForAcceptance,
    };
  }, [repairs]);

  const columns = [
    {
      header: 'Судно / Док',
      accessor: 'shipName' as keyof ExtendedRepair,
      sortable: true,
      cell: (value: string, repair: ExtendedRepair) => (
        <div className="flex items-center">
          <div className="h-10 w-10 bg-[var(--soft)] border border-[var(--line)] rounded-lg flex items-center justify-center mr-3">
            <Ship className="h-5 w-5 text-[var(--ink)]" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{value}</p>
            <p className="text-sm text-gray-600">
              {repair.dock}
              {repair.requestStatus
                ? ` • ${REPAIR_REQUEST_STATUS_LABELS[repair.requestStatus as keyof typeof REPAIR_REQUEST_STATUS_LABELS] ?? repair.requestStatus}`
                : ''}
            </p>
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
      header: 'Проверка работ',
      accessor: 'tasks' as keyof ExtendedRepair,
      align: 'center' as const,
      cell: (_value: ExtendedRepair['tasks'], repair: ExtendedRepair) => {
        const totalTasks = repair.tasks.length;
        if (totalTasks === 0) {
          return <span className="text-xs text-gray-500">Нет данных</span>;
        }

        const approved = repair.tasks.filter((task) => task.reviewStatus === 'APPROVED').length;
        const pendingReview = repair.tasks.filter((task) => task.reviewStatus === 'PENDING_REVIEW').length;
        const inWork = totalTasks - approved - pendingReview;

        return (
          <div className="text-xs text-center">
            <div className="font-medium text-gray-800">{approved}/{totalTasks} принято</div>
            <div className="text-gray-500">{pendingReview} {WORK_REVIEW_STATUS_LABELS.PENDING_REVIEW.toLowerCase()}</div>
            {inWork > 0 && <div className="text-gray-400">{inWork} в работе</div>}
          </div>
        );
      },
    },
    {
      header: 'Тип / Приоритет',
      accessor: 'repairType' as keyof ExtendedRepair,
      sortable: true,
      cell: (value: string, repair: ExtendedRepair) => (
        <div className="space-y-2">
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-xs text-[var(--muted)]">Приоритет: {repair.priority}</div>
        </div>
      ),
    },
    {
      header: 'Статус',
      accessor: 'status' as keyof ExtendedRepair,
      sortable: true,
      align: 'center' as const,
      cell: (value: string) => (
        <div className="flex justify-center"><V7StateText value={value.toUpperCase()} /></div>
      ),
    },
    {
      header: 'Сроки',
      accessor: 'startDate' as keyof ExtendedRepair,
      sortable: true,
      align: 'center' as const,
      cell: (_value: string, repair: ExtendedRepair) => (
        <div className="text-center">
          <div className="font-semibold text-gray-900">{formatDateRangeRu(repair.startDate, repair.endDate)}</div>
        </div>
      ),
    },
    {
      header: 'Оператор ремонта',
      accessor: 'manager' as keyof ExtendedRepair,
      sortable: true,
      cell: (value: string, repair: ExtendedRepair) => (
        user?.role === 'dispatcher' ? (
          <select
            value={repair.operatorId ?? ''}
            onChange={(event) => void handleAssignOperator(repair.id, event.target.value)}
            onClick={(event) => event.stopPropagation()}
            className="text-sm border rounded px-2 py-1 max-w-[220px]"
          >
            <option value="">Не назначен</option>
            {operators.map((operator) => (
              <option key={operator.id} value={operator.id}>
                {operator.fullName}
              </option>
            ))}
          </select>
        ) : (
          <div className="flex items-center">
            <div className="h-8 w-8 bg-[var(--soft)] border border-[var(--line)] rounded-full flex items-center justify-center mr-2">
              <Users className="h-4 w-4 text-[var(--ink)]" />
            </div>
            <span className="font-medium text-gray-900">
              {user?.role === 'client' ? 'Назначен верфью' : value}
            </span>
          </div>
        )
      ),
    },
  ];

  if (user?.role === 'client') {
    columns.push({
      header: 'Приемка клиента',
      accessor: 'acceptanceAction' as keyof ExtendedRepair,
      sortable: false,
      align: 'center' as const,
      cell: (_value: string, repair: ExtendedRepair) => {
        if (repair.clientAccepted) {
          return <span className="text-xs font-medium text-[var(--ink)]">Принято</span>;
        }

        const readyForAcceptance =
          repair.status === 'завершён' &&
          repair.tasks.length > 0 &&
          repair.tasks.every((task) => task.reviewStatus === 'APPROVED');

        if (!readyForAcceptance) {
          return <span className="text-xs text-gray-500">Ожидает готовности</span>;
        }

        return (
          <Button
            size="sm"
            onClick={() => {
              void (async () => {
                setError(null);
                setAcceptingRepairRequestId(repair.shipId);
                try {
                  await acceptRepairRequestByClient(repair.shipId);
                  await loadRepairs();
                } catch {
                  setError('Не удалось подтвердить приемку');
                } finally {
                  setAcceptingRepairRequestId(null);
                }
              })();
            }}
            disabled={acceptingRepairRequestId === repair.shipId}
          >
            {acceptingRepairRequestId === repair.shipId ? 'Подтверждение...' : 'Подтвердить'}
          </Button>
        );
      },
    });
  }

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
      <V7PageHeader
        title="Ремонты и распределение"
        description="Сводный журнал ремонтов, заявок и рабочих задач."
        actions={
          <div className="flex gap-2">
            {user?.role === 'dispatcher' && (
              <Button variant="outline" onClick={() => navigate('/requests')}>Заявки</Button>
            )}
            {user?.role === 'client' && (
              <Button variant="primary" icon={Plus} onClick={() => setShowRepairForm(true)}>Новая заявка</Button>
            )}
          </div>
        }
      />

      {error && <div className="px-4 py-3 rounded-lg border bg-[var(--danger-bg)] border-[var(--danger-line)] text-[var(--danger-ink)]">{error}</div>}
      {loading && <div className="px-4 py-3 rounded-lg border bg-[var(--soft)] border-[var(--line)] text-[var(--muted)]">Загрузка...</div>}

      <div className={`grid grid-cols-2 gap-3 ${user?.role === 'dispatcher' || user?.role === 'client' ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
        <div className="rounded-[8px] border border-[var(--line)] bg-[rgba(255,255,255,0.97)] px-3 py-3">
          <span className="block text-xs text-[var(--muted)]">Всего ремонтов</span>
          <strong className="mt-1 block text-xl leading-tight text-[var(--ink)]">{stats.total}</strong>
        </div>
        <div className="rounded-[8px] border border-[var(--line)] bg-[rgba(255,255,255,0.97)] px-3 py-3">
          <span className="block text-xs text-[var(--muted)]">В работе</span>
          <strong className="mt-1 block text-xl leading-tight text-[var(--ink)]">{stats.inProgress}</strong>
        </div>
        <div className="rounded-[8px] border border-[var(--line)] bg-[rgba(255,255,255,0.97)] px-3 py-3">
          <span className="block text-xs text-[var(--muted)]">Запланировано</span>
          <strong className="mt-1 block text-xl leading-tight text-[var(--ink)]">{stats.planned}</strong>
        </div>
        <div className="rounded-[8px] border border-[var(--line)] bg-[rgba(255,255,255,0.97)] px-3 py-3">
          <span className="block text-xs text-[var(--muted)]">Завершено</span>
          <strong className="mt-1 block text-xl leading-tight text-[var(--ink)]">{stats.completed}</strong>
        </div>
        {user?.role === 'dispatcher' && (
          <div className="rounded-[8px] border border-[var(--line)] bg-[rgba(255,255,255,0.97)] px-3 py-3">
            <span className="block text-xs text-[var(--muted)]">Без оператора</span>
            <strong className="mt-1 block text-xl leading-tight text-[var(--ink)]">{stats.unassignedOperators}</strong>
          </div>
        )}
        {user?.role === 'client' && (
          <div className="rounded-[8px] border border-[var(--line)] bg-[rgba(255,255,255,0.97)] px-3 py-3">
            <span className="block text-xs text-[var(--muted)]">К приемке</span>
            <strong className="mt-1 block text-xl leading-tight text-[var(--ink)]">{stats.readyForAcceptance}</strong>
          </div>
        )}
      </div>

      <V7Panel>
        <V7PanelTitle title="Фильтры и поиск" />
        <div className={`grid grid-cols-1 gap-4 ${user?.role === 'dispatcher' || user?.role === 'client' ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-2">Поиск</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--muted)] h-5 w-5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Судно, док, оператор..."
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
                className="w-full pl-10 pr-4 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
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
            <label className="block text-sm font-medium text-[var(--muted)] mb-2">Док</label>
            <select
              value={dockFilter}
              onChange={(e) => setDockFilter(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
            >
              {uniqueDocks.map((dock) => (
                <option key={dock} value={dock}>
                  {dock === 'все' ? 'Все доки' : dock}
                </option>
              ))}
            </select>
          </div>
          {user?.role === 'dispatcher' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Очередь решений</label>
              <Button
                variant={showOnlyUnassigned ? 'primary' : 'outline'}
                className="w-full"
                onClick={() => setShowOnlyUnassigned((value) => !value)}
              >
                {showOnlyUnassigned ? 'Показать все ремонты' : 'Только без оператора'}
              </Button>
            </div>
          )}
          {user?.role === 'client' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Приемка клиента</label>
              <Button
                variant={showReadyForAcceptanceOnly ? 'primary' : 'outline'}
                className="w-full"
                onClick={() => setShowReadyForAcceptanceOnly((value) => !value)}
              >
                {showReadyForAcceptanceOnly ? 'Показать все ремонты' : 'Только к приемке'}
              </Button>
            </div>
          )}
        </div>
      </V7Panel>

      <V7Panel>
        <V7PanelTitle
          title={`Ремонты (${filteredRepairs.length})`}
         
          extra={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('');
                setStatusFilter('все');
                setDockFilter('все');
                setShowOnlyUnassigned(false);
                setShowReadyForAcceptanceOnly(false);
              }}
            >
              Сбросить фильтры
            </Button>
          }
        />
        <DataTable
          data={filteredRepairs}
          columns={columns}
          onRowClick={handleRowClick}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSort={handleSort}
          className="mt-4"
          emptyMessage="Ремонты не найдены"
        />
      </V7Panel>

      {showRepairForm && (
        <RepairRequestForm
          onClose={handleCloseForm}
          onSubmit={handleAddRepairRequest}
          ships={ships}
          allowNewShip={user?.role === 'client'}
        />
      )}
    </div>
  );
}

