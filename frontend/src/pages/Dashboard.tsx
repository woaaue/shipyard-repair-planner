import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapPin, User } from 'lucide-react';
import { getRepairs } from '../services/repairs';
import { getRepairRequests, type RepairRequestResponse } from '../services/repairRequests';
import { getWorkItems, type WorkItemResponse } from '../services/workItems';
import { getDocks } from '../services/docks';
import { getSubordinates } from '../services/users';
import { getShips } from '../services/ships';
import V7PageHeader from '../components/v7/V7PageHeader';
import V7Panel from '../components/v7/V7Panel';
import V7PanelTitle from '../components/v7/V7PanelTitle';
import V7StateText from '../components/v7/V7StateText';
import Button from '../components/ui/Button';
import { REPAIR_REQUEST_STATUS_LABELS, WORK_REVIEW_STATUS_LABELS } from '../constants/labels';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repairs, setRepairs] = useState<Awaited<ReturnType<typeof getRepairs>>>([]);
  const [repairRequests, setRepairRequests] = useState<RepairRequestResponse[]>([]);
  const [workItems, setWorkItems] = useState<WorkItemResponse[]>([]);
  const [repairRequestsCount, setRepairRequestsCount] = useState(0);
  const [workItemsCount, setWorkItemsCount] = useState(0);
  const [docksCount, setDocksCount] = useState(0);
  const [ownedShipsCount, setOwnedShipsCount] = useState(0);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const repairsPromise = getRepairs();
        const repairRequestsPromise =
          user?.role === 'client' && typeof user.id === 'number'
            ? getRepairRequests({ clientId: user.id })
            : getRepairRequests();
        const workItemsPromise =
          user?.role === 'worker' && typeof user.id === 'number'
            ? getWorkItems({ assigneeId: user.id })
            : getWorkItems();

        const [repairsData, repairRequestsData, workItemsData, docksData, subordinates, shipsData] = await Promise.all([
          repairsPromise,
          repairRequestsPromise,
          workItemsPromise,
          getDocks(),
          (user?.role === 'master' || user?.role === 'dispatcher') && typeof user.id === 'number'
            ? getSubordinates(user.id)
            : Promise.resolve([]),
          user?.role === 'client' && typeof user.id === 'number'
            ? getShips()
            : Promise.resolve([]),
        ]);

        const subordinateIds = new Set(subordinates.map((item) => item.id));
        const dockScopedRepairs =
          (user?.role === 'operator' || user?.role === 'master' || user?.role === 'worker') && user.dock
            ? repairsData.filter((repair) => repair.dock === user.dock)
            : repairsData;
        const scopedRepairs =
          user?.role === 'client' && typeof user.id === 'number'
            ? repairsData.filter((repair) =>
                shipsData.some((ship) => ship.id === repair.shipId && ship.ownerId === user.id)
              )
            : dockScopedRepairs;

        const scopedWorkItems =
          user?.role === 'master'
            ? workItemsData.filter((item) => item.assigneeId !== null && subordinateIds.has(item.assigneeId))
            : user?.role === 'operator'
            ? workItemsData.filter((item) => scopedRepairs.some((repair) => repair.id === item.repairId))
            : workItemsData;

        setRepairs(scopedRepairs);
        setRepairRequests(repairRequestsData);
        setWorkItems(scopedWorkItems);
        setRepairRequestsCount(repairRequestsData.length);
        setWorkItemsCount(scopedWorkItems.length);
        setDocksCount(docksData.length);
        setOwnedShipsCount(
          user?.role === 'client' && typeof user.id === 'number'
            ? shipsData.filter((ship) => ship.ownerId === user.id).length
            : 0
        );
      } catch {
        setError('Не удалось загрузить данные главной страницы');
      } finally {
        setLoading(false);
      }
    };

    void loadDashboard();
  }, [user?.id, user?.role]);

  const activeRepairs = useMemo(
    () => repairs.filter((repair) => repair.status === 'в работе' || repair.status === 'запланирован'),
    [repairs]
  );

  const clientPendingRequests = useMemo(
    () =>
      repairRequests.filter((request) =>
        ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'IN_PROGRESS'].includes(request.status)
      ),
    [repairRequests]
  );

  const clientReadyForAcceptanceRepairs = useMemo(
    () =>
      repairs.filter((repair) => {
        const request = repairRequests.find((item) => item.shipId === repair.shipId);
        return repair.status === 'завершён' && request && !request.clientAccepted;
      }),
    [repairs, repairRequests]
  );
  const workerTasks = useMemo(
    () => (user?.role === 'worker' ? workItemsCount : 0),
    [user?.role, workItemsCount]
  );
  const workerInProgressTasks = useMemo(
    () => workItems.filter((item) => item.status === 'IN_PROGRESS').length,
    [workItems]
  );
  const workerPendingReviewTasks = useMemo(
    () => workItems.filter((item) => item.reviewStatus === 'PENDING_REVIEW').length,
    [workItems]
  );
  const workerBacklogTasks = useMemo(
    () => workItems.filter((item) => item.status === 'PENDING' && item.reviewStatus === 'NOT_SUBMITTED').length,
    [workItems]
  );
  const workerRecentTasks = useMemo(
    () =>
      [...workItems]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5),
    [workItems]
  );
  const dispatcherPendingRequests = useMemo(
    () =>
      repairRequests.filter((request) => request.status === 'SUBMITTED' || request.status === 'UNDER_REVIEW').length,
    [repairRequests]
  );
  const dispatcherOverdueRequests = useMemo(
    () =>
      repairRequests.filter((request) => {
        if (!(request.status === 'SUBMITTED' || request.status === 'UNDER_REVIEW')) return false;
        const createdAt = new Date(request.createdAt);
        if (Number.isNaN(createdAt.getTime())) return false;
        return Date.now() - createdAt.getTime() > 2 * 24 * 60 * 60 * 1000;
      }).length,
    [repairRequests]
  );
  const dispatcherQueue = useMemo(
    () =>
      repairRequests
        .filter((request) => request.status === 'SUBMITTED' || request.status === 'UNDER_REVIEW')
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .slice(0, 6),
    [repairRequests]
  );
  const masterManagedRepairs = useMemo(
    () => (user?.role === 'master' ? activeRepairs.length : 0),
    [user?.role, activeRepairs]
  );
  const masterPendingReviewTasks = useMemo(
    () => workItems.filter((item) => item.reviewStatus === 'PENDING_REVIEW').length,
    [workItems]
  );
  const masterRejectedTasks = useMemo(
    () => workItems.filter((item) => item.reviewStatus === 'REJECTED').length,
    [workItems]
  );
  const masterBacklogTasks = useMemo(
    () => workItems.filter((item) => item.status === 'PENDING' && item.reviewStatus === 'NOT_SUBMITTED').length,
    [workItems]
  );
  const masterQueue = useMemo(
    () =>
      [...workItems]
        .filter((item) => item.reviewStatus === 'PENDING_REVIEW' || item.reviewStatus === 'REJECTED')
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 6),
    [workItems]
  );
  const operatorRepairs = useMemo(
    () => (user?.role === 'operator' ? repairs : []),
    [user?.role, repairs]
  );
  const operatorActiveRepairs = useMemo(
    () =>
      operatorRepairs.filter(
        (repair) => repair.status === 'в работе' || repair.status === 'запланирован'
      ),
    [operatorRepairs]
  );
  const operatorUnassignedRepairs = useMemo(
    () => operatorRepairs.filter((repair) => !repair.operatorId).length,
    [operatorRepairs]
  );

  if (user?.role === 'client') {
    return (
      <div className="space-y-6">
        <V7PageHeader
          title="Мой флот и ремонты"
          description="Заявки, текущие ремонты и приемка завершенных работ."
          actions={<Button onClick={() => navigate('/repairs?new=true')}>Новая заявка</Button>}
        />

        {error && <div className="px-4 py-3 rounded-lg border bg-[var(--danger-bg)] border-[var(--danger-line)] text-[var(--danger-ink)]">{error}</div>}
        {loading && <div className="px-4 py-3 rounded-lg border bg-[var(--soft)] border-[var(--line)] text-[var(--muted)]">Загрузка...</div>}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="rounded-[8px] border border-[var(--line)] bg-[rgba(255,255,255,0.97)] px-3 py-3">
            <span className="block text-xs text-[var(--muted)]">Мои суда</span>
            <strong className="mt-1 block text-xl leading-tight text-[var(--ink)]">{ownedShipsCount}</strong>
          </div>
          <div className="rounded-[8px] border border-[var(--line)] bg-[rgba(255,255,255,0.97)] px-3 py-3">
            <span className="block text-xs text-[var(--muted)]">Активные ремонты</span>
            <strong className="mt-1 block text-xl leading-tight text-[var(--ink)]">{activeRepairs.length}</strong>
          </div>
          <div className="rounded-[8px] border border-[var(--line)] bg-[rgba(255,255,255,0.97)] px-3 py-3">
            <span className="block text-xs text-[var(--muted)]">Заявки в работе</span>
            <strong className="mt-1 block text-xl leading-tight text-[var(--ink)]">{clientPendingRequests.length}</strong>
          </div>
          <div className="rounded-[8px] border border-[var(--line)] bg-[rgba(255,255,255,0.97)] px-3 py-3">
            <span className="block text-xs text-[var(--muted)]">К приемке</span>
            <strong className="mt-1 block text-xl leading-tight text-[var(--ink)]">{clientReadyForAcceptanceRepairs.length}</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <V7Panel>
            <V7PanelTitle title="Мои заявки" />
            {repairRequests.length === 0 ? (
              <div className="text-sm text-[var(--muted)]">Заявок пока нет.</div>
            ) : (
              <div className="space-y-3">
                {repairRequests.slice(0, 6).map((request) => (
                  <div key={request.id} className="border border-[var(--line)] rounded-lg p-3 bg-white">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="font-semibold text-[var(--ink)]">{request.shipName}</div>
                      <V7StateText value={REPAIR_REQUEST_STATUS_LABELS[request.status] ?? request.status} />
                    </div>
                    <div className="text-xs text-[var(--muted)]">
                      Заявка #{request.id}
                      {request.assignedDockName ? ` · ${request.assignedDockName}` : ''}
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full" onClick={() => navigate('/repairs')}>
                  Открыть все заявки и ремонты
                </Button>
              </div>
            )}
          </V7Panel>

          <V7Panel>
            <V7PanelTitle title="Требуют приемки" />
            {clientReadyForAcceptanceRepairs.length === 0 ? (
              <div className="text-sm text-[var(--muted)]">Сейчас нет ремонтов, ожидающих приемки.</div>
            ) : (
              <div className="space-y-3">
                {clientReadyForAcceptanceRepairs.slice(0, 6).map((repair) => (
                  <button
                    key={repair.id}
                    type="button"
                    className="w-full text-left border border-[var(--line)] rounded-lg p-3 bg-white hover:bg-[var(--soft)]"
                    onClick={() => navigate(`/repairs/${repair.id}`)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-[var(--ink)]">{repair.shipName}</div>
                      <div className="text-sm font-medium text-[var(--ink)]">{repair.progress}%</div>
                    </div>
                    <div className="text-xs text-[var(--muted)] mt-1">{repair.dock}</div>
                  </button>
                ))}
              </div>
            )}
          </V7Panel>
        </div>
      </div>
    );
  }

  if (user?.role === 'worker') {
    return (
      <div className="space-y-6">
        <V7PageHeader
          title="Мои задачи"
          description="Личный рабочий список и активные ремонты."
        />
        {error && <div className="px-4 py-3 rounded-lg border bg-[var(--danger-bg)] border-[var(--danger-line)] text-[var(--danger-ink)]">{error}</div>}
        {loading && <div className="px-4 py-3 rounded-lg border bg-[var(--soft)] border-[var(--line)] text-[var(--muted)]">Загрузка...</div>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-[8px] border border-[var(--line)] bg-[rgba(255,255,255,0.97)] px-3 py-3">
            <span className="block text-xs text-[var(--muted)]">Всего моих задач</span>
            <strong className="mt-1 block text-xl leading-tight text-[var(--ink)]">{workerTasks}</strong>
          </div>
          <div className="rounded-[8px] border border-[var(--line)] bg-[rgba(255,255,255,0.97)] px-3 py-3">
            <span className="block text-xs text-[var(--muted)]">В работе / на проверке</span>
            <strong className="mt-1 block text-xl leading-tight text-[var(--ink)]">
              {workerInProgressTasks} / {workerPendingReviewTasks}
            </strong>
          </div>
          <div className="rounded-[8px] border border-[var(--line)] bg-[rgba(255,255,255,0.97)] px-3 py-3">
            <span className="block text-xs text-[var(--muted)]">Не начаты</span>
            <strong className="mt-1 block text-xl leading-tight text-[var(--ink)]">{workerBacklogTasks}</strong>
          </div>
        </div>
        <V7Panel>
          <V7PanelTitle title="Последние задачи" />
          {workerRecentTasks.length === 0 ? (
            <div className="text-sm text-[var(--muted)]">Пока нет назначенных задач.</div>
          ) : (
            <div className="space-y-2">
              {workerRecentTasks.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="w-full text-left border border-[var(--line)] rounded-lg p-3 bg-white hover:bg-[var(--soft)]"
                  onClick={() => navigate(`/repairs/${item.repairId}/tasks/${item.id}`)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-[var(--ink)]">{item.name}</div>
                    <div className="text-xs text-[var(--muted)]">
                      {WORK_REVIEW_STATUS_LABELS[item.reviewStatus] ?? item.reviewStatus}
                    </div>
                  </div>
                  <div className="text-xs text-[var(--muted)] mt-1">
                    #{item.id} · {item.assigneeFullName ?? 'Без исполнителя'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </V7Panel>
      </div>
    );
  }

  if (user?.role === 'master') {
    return (
      <div className="space-y-6">
        <V7PageHeader
          title="Сводка мастера"
          description="Контроль задач бригады и прогресса ремонтов."
        />
        {error && <div className="px-4 py-3 rounded-lg border bg-[var(--danger-bg)] border-[var(--danger-line)] text-[var(--danger-ink)]">{error}</div>}
        {loading && <div className="px-4 py-3 rounded-lg border bg-[var(--soft)] border-[var(--line)] text-[var(--muted)]">Загрузка...</div>}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="rounded-[8px] border border-[var(--line)] bg-[rgba(255,255,255,0.97)] px-3 py-3">
            <span className="block text-xs text-[var(--muted)]">Задачи бригады</span>
            <strong className="mt-1 block text-xl leading-tight text-[var(--ink)]">{workItemsCount}</strong>
          </div>
          <div className="rounded-[8px] border border-[var(--line)] bg-[rgba(255,255,255,0.97)] px-3 py-3">
            <span className="block text-xs text-[var(--muted)]">Активные ремонты</span>
            <strong className="mt-1 block text-xl leading-tight text-[var(--ink)]">{masterManagedRepairs}</strong>
          </div>
          <div className="rounded-[8px] border border-[var(--line)] bg-[rgba(255,255,255,0.97)] px-3 py-3">
            <span className="block text-xs text-[var(--muted)]">На проверке</span>
            <strong className="mt-1 block text-xl leading-tight text-[var(--ink)]">{masterPendingReviewTasks}</strong>
          </div>
          <div className="rounded-[8px] border border-[var(--line)] bg-[rgba(255,255,255,0.97)] px-3 py-3">
            <span className="block text-xs text-[var(--muted)]">Отклонено / не начаты</span>
            <strong className="mt-1 block text-xl leading-tight text-[var(--ink)]">
              {masterRejectedTasks} / {masterBacklogTasks}
            </strong>
          </div>
        </div>
        <V7Panel>
          <V7PanelTitle title="Очередь мастера (проверка и возвраты)" />
          {masterQueue.length === 0 ? (
            <div className="text-sm text-[var(--muted)]">Нет задач на проверку или возврат.</div>
          ) : (
            <div className="space-y-2">
              {masterQueue.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="w-full text-left border border-[var(--line)] rounded-lg p-3 bg-white hover:bg-[var(--soft)]"
                  onClick={() => navigate(`/repairs/${item.repairId}/tasks/${item.id}`)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-[var(--ink)]">{item.name}</div>
                    <div className="text-xs text-[var(--muted)]">
                      {WORK_REVIEW_STATUS_LABELS[item.reviewStatus] ?? item.reviewStatus}
                    </div>
                  </div>
                  <div className="text-xs text-[var(--muted)] mt-1">
                    {item.assigneeFullName ?? 'Без исполнителя'} · Обновлено {new Date(item.updatedAt).toLocaleString('ru-RU')}
                  </div>
                </button>
              ))}
            </div>
          )}
        </V7Panel>
      </div>
    );
  }

  if (user?.role === 'dispatcher') {
    return (
      <div className="space-y-6">
        <V7PageHeader
          title="Панель диспетчера"
          description="Очередь заявок, распределение по докам и контроль операторов."
        />
        {error && <div className="px-4 py-3 rounded-lg border bg-[var(--danger-bg)] border-[var(--danger-line)] text-[var(--danger-ink)]">{error}</div>}
        {loading && <div className="px-4 py-3 rounded-lg border bg-[var(--soft)] border-[var(--line)] text-[var(--muted)]">Загрузка...</div>}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="rounded-[8px] border border-[var(--line)] bg-[rgba(255,255,255,0.97)] px-3 py-3">
            <span className="block text-xs text-[var(--muted)]">Заявки в очереди</span>
            <strong className="mt-1 block text-xl leading-tight text-[var(--ink)]">{dispatcherPendingRequests}</strong>
          </div>
          <div className="rounded-[8px] border border-[var(--line)] bg-[rgba(255,255,255,0.97)] px-3 py-3">
            <span className="block text-xs text-[var(--muted)]">Активные ремонты</span>
            <strong className="mt-1 block text-xl leading-tight text-[var(--ink)]">{activeRepairs.length}</strong>
          </div>
          <div className="rounded-[8px] border border-[var(--line)] bg-[rgba(255,255,255,0.97)] px-3 py-3">
            <span className="block text-xs text-[var(--muted)]">Всего доков</span>
            <strong className="mt-1 block text-xl leading-tight text-[var(--ink)]">{docksCount}</strong>
          </div>
          <div className="rounded-[8px] border border-[var(--line)] bg-[rgba(255,255,255,0.97)] px-3 py-3">
            <span className="block text-xs text-[var(--muted)]">Рабочие задачи</span>
            <strong className="mt-1 block text-xl leading-tight text-[var(--ink)]">{workItemsCount}</strong>
          </div>
          <div className="rounded-[8px] border border-[var(--line)] bg-[rgba(255,255,255,0.97)] px-3 py-3">
            <span className="block text-xs text-[var(--muted)]">SLA просрочено</span>
            <strong className="mt-1 block text-xl leading-tight text-[var(--ink)]">{dispatcherOverdueRequests}</strong>
          </div>
        </div>
        <V7Panel>
          <V7PanelTitle title="Ближайшая очередь заявок" />
          {dispatcherQueue.length === 0 ? (
            <div className="text-sm text-[var(--muted)]">Очередь пуста.</div>
          ) : (
            <div className="space-y-2">
              {dispatcherQueue.map((request) => (
                <button
                  key={request.id}
                  type="button"
                  className="w-full text-left border border-[var(--line)] rounded-lg p-3 bg-white hover:bg-[var(--soft)]"
                  onClick={() => navigate('/requests')}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-[var(--ink)]">#{request.id} · {request.shipName}</div>
                    <V7StateText value={REPAIR_REQUEST_STATUS_LABELS[request.status] ?? request.status} />
                  </div>
                  <div className="text-xs text-[var(--muted)] mt-1">
                    {request.clientName} · Создана {new Date(request.createdAt).toLocaleString('ru-RU')}
                  </div>
                </button>
              ))}
            </div>
          )}
        </V7Panel>
      </div>
    );
  }

  if (user?.role === 'operator') {
    return (
      <div className="space-y-6">
        <V7PageHeader
          title="Панель оператора"
          description="Оперативный контроль ремонтов и задач по вашему доку."
        />
        {error && <div className="px-4 py-3 rounded-lg border bg-[var(--danger-bg)] border-[var(--danger-line)] text-[var(--danger-ink)]">{error}</div>}
        {loading && <div className="px-4 py-3 rounded-lg border bg-[var(--soft)] border-[var(--line)] text-[var(--muted)]">Загрузка...</div>}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="rounded-[8px] border border-[var(--line)] bg-[rgba(255,255,255,0.97)] px-3 py-3">
            <span className="block text-xs text-[var(--muted)]">Ремонтов в зоне</span>
            <strong className="mt-1 block text-xl leading-tight text-[var(--ink)]">{operatorRepairs.length}</strong>
          </div>
          <div className="rounded-[8px] border border-[var(--line)] bg-[rgba(255,255,255,0.97)] px-3 py-3">
            <span className="block text-xs text-[var(--muted)]">Активные ремонты</span>
            <strong className="mt-1 block text-xl leading-tight text-[var(--ink)]">{operatorActiveRepairs.length}</strong>
          </div>
          <div className="rounded-[8px] border border-[var(--line)] bg-[rgba(255,255,255,0.97)] px-3 py-3">
            <span className="block text-xs text-[var(--muted)]">Рабочие задачи</span>
            <strong className="mt-1 block text-xl leading-tight text-[var(--ink)]">{workItemsCount}</strong>
          </div>
          <div className="rounded-[8px] border border-[var(--line)] bg-[rgba(255,255,255,0.97)] px-3 py-3">
            <span className="block text-xs text-[var(--muted)]">Без назначения</span>
            <strong className="mt-1 block text-xl leading-tight text-[var(--ink)]">{operatorUnassignedRepairs}</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <V7Panel>
            <V7PanelTitle title="Активные ремонты дока" />
            {operatorActiveRepairs.length === 0 ? (
              <div className="text-sm text-[var(--muted)]">Активных ремонтов сейчас нет.</div>
            ) : (
              <div className="space-y-3">
                {operatorActiveRepairs.slice(0, 6).map((repair) => (
                  <button
                    key={repair.id}
                    type="button"
                    className="w-full text-left border border-[var(--line)] rounded-lg p-3 bg-white hover:bg-[var(--soft)]"
                    onClick={() => navigate(`/repairs/${repair.id}`)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-[var(--ink)]">{repair.shipName}</div>
                      <div className="text-sm font-medium text-[var(--ink)]">{repair.progress}%</div>
                    </div>
                    <div className="text-xs text-[var(--muted)] mt-1">{repair.dock}</div>
                  </button>
                ))}
              </div>
            )}
          </V7Panel>

          <V7Panel>
            <V7PanelTitle title="Задачи и контроль" />
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-[var(--soft)] rounded-lg border border-[var(--line)]">
                <div>
                  <p className="font-medium text-[var(--ink)]">Рабочие задачи</p>
                  <p className="text-sm text-[var(--muted)]">Задачи в исполнении бригадами</p>
                </div>
                <div className="text-right text-lg font-bold text-[var(--ink)]">{workItemsCount}</div>
              </div>
              <div className="flex items-center justify-between p-3 bg-[var(--soft)] rounded-lg border border-[var(--line)]">
                <div>
                  <p className="font-medium text-[var(--ink)]">Завершенные ремонты</p>
                  <p className="text-sm text-[var(--muted)]">Итог по вашему контуру</p>
                </div>
                <div className="text-right text-lg font-bold text-[var(--ink)]">
                  {operatorRepairs.filter((repair) => repair.status === 'завершён').length}
                </div>
              </div>
            </div>
          </V7Panel>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <V7PageHeader
        title="Рабочая сводка"
        description="Обзор состояния ремонтов и судов"
        actions={
          <div className="text-sm text-[var(--muted)]">
            {new Date().toLocaleDateString('ru-RU', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        }
      />

      {error && <div className="px-4 py-3 rounded-lg border bg-[var(--danger-bg)] border-[var(--danger-line)] text-[var(--danger-ink)]">{error}</div>}
      {loading && <div className="px-4 py-3 rounded-lg border bg-[var(--soft)] border-[var(--line)] text-[var(--muted)]">Загрузка...</div>}

      <V7Panel>
        <V7PanelTitle title="Сводка системы" />
        <p className="text-sm text-[var(--muted)]">
          Активные ремонты: {activeRepairs.length} · Заявки: {repairRequestsCount} · Работы: {workItemsCount} · Доки:{' '}
          {docksCount}
        </p>
      </V7Panel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <V7Panel>
          <V7PanelTitle title="Активные ремонты" />
          <div className="text-sm text-[var(--muted)] mb-4">Текущие работы в доках: {activeRepairs.length}</div>

          {activeRepairs.length > 0 ? (
            <div className="space-y-4">
              {activeRepairs.slice(0, 6).map((repair) => (
                <div
                  key={repair.id}
                  className="border border-[var(--line)] rounded-xl p-4 sm:p-5 hover:border-[var(--line-strong)] hover:bg-[var(--soft)] transition-all duration-300 group cursor-pointer"
                  onClick={() => navigate(`/repairs/${repair.id}`)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-[var(--ink)] group-hover:text-[var(--blue)] transition-colors text-start">
                        {repair.shipName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--muted)] mt-1">
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
                    <div className="flex flex-col sm:flex-row sm:justify-between text-sm text-[var(--muted)] mb-1.5 gap-1">
                      <span>Прогресс</span>
                      <span className="font-medium">{repair.progress}% завершено</span>
                    </div>
                    <div className="w-full bg-[var(--line)] rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-[var(--blue)] h-full rounded-full transition-all duration-500"
                        style={{ width: `${repair.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-[var(--muted)]">Активных ремонтов нет.</div>
          )}
        </V7Panel>

        <V7Panel>
          <V7PanelTitle title="Ключевые показатели" />
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-[var(--soft)] rounded-lg border border-[var(--line)]">
              <div>
                <p className="font-medium text-[var(--ink)]">Активные ремонты</p>
                <p className="text-sm text-[var(--muted)]">Требуют операционного контроля</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-[var(--ink)]">{activeRepairs.length}</div>
                <div className="text-xs text-gray-500">ед.</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-[var(--soft)] rounded-lg border border-[var(--line)]">
              <div>
                <p className="font-medium text-[var(--ink)]">Заявки</p>
                <p className="text-sm text-[var(--muted)]">Текущий входящий поток</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-[var(--ink)]">{repairRequestsCount}</div>
                <div className="text-xs text-gray-500">ед.</div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-[var(--soft)] rounded-lg border border-[var(--line)]">
              <div>
                <p className="font-medium text-[var(--ink)]">Рабочие задачи</p>
                <p className="text-sm text-[var(--muted)]">Задачи в исполнении</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-[var(--ink)]">{workItemsCount}</div>
                <div className="text-xs text-gray-500">ед.</div>
              </div>
            </div>
          </div>
        </V7Panel>
      </div>

    </div>
  );
}
