import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Button from '../components/ui/Button';
import { getDocks } from '../services/docks';
import { getRepairs } from '../services/repairs';
import {
  getRepairRequests,
  type RepairRequestResponse,
  updateRepairRequestStatus,
} from '../services/repairRequests';
import V7PageHeader from '../components/v7/V7PageHeader';
import V7Panel from '../components/v7/V7Panel';
import V7PanelTitle from '../components/v7/V7PanelTitle';
import V7StateText from '../components/v7/V7StateText';
import { REPAIR_REQUEST_STATUS_LABELS } from '../constants/labels';
import { canRunRepairRequestAction } from '../domain/workflow/repairRequestWorkflow';

const REQUEST_STEPS: Array<{ key: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'IN_PROGRESS'; label: string }> = [
  { key: 'SUBMITTED', label: 'Подана' },
  { key: 'UNDER_REVIEW', label: 'Рассмотрение' },
  { key: 'APPROVED', label: 'Согласована' },
  { key: 'IN_PROGRESS', label: 'Передана в работу' },
];

function getStepState(
  requestStatus: RepairRequestResponse['status'],
  stepKey: (typeof REQUEST_STEPS)[number]['key'],
  stepIndex: number
): 'done' | 'current' | 'pending' {
  if (requestStatus === 'REJECTED') {
    return stepKey === 'UNDER_REVIEW' ? 'done' : 'pending';
  }
  const statusOrder: RepairRequestResponse['status'][] = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'IN_PROGRESS'];
  const currentIndex = statusOrder.indexOf(requestStatus);
  if (currentIndex < 0) return 'pending';
  if (stepIndex < currentIndex) return 'done';
  if (stepIndex === currentIndex) return 'current';
  return 'pending';
}

function extractApiErrorMessage(error: unknown): string | null {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      return 'Сессия истекла. Войдите в систему заново.';
    }
    if (error.response?.status === 403) {
      return 'Недостаточно прав для этого действия.';
    }
    const message = (error.response?.data as { message?: string } | undefined)?.message;
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
  }
  return null;
}

export default function DispatcherRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<RepairRequestResponse[]>([]);
  const [docks, setDocks] = useState<Array<{ id: number; name: string }>>([]);
  const [repairIdByRequestId, setRepairIdByRequestId] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [requestActionLoadingId, setRequestActionLoadingId] = useState<number | null>(null);
  const [requestDockById, setRequestDockById] = useState<Record<number, string>>({});
  const [requestRejectReasonById, setRequestRejectReasonById] = useState<Record<number, string>>({});
  const [queueFilter, setQueueFilter] = useState<'all' | 'submitted' | 'under_review'>('all');
  const [viewMode, setViewMode] = useState<'queue' | 'history'>('queue');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'approved' | 'rejected' | 'in_progress'>('all');
  const [search, setSearch] = useState('');
  const [expandedRequestIds, setExpandedRequestIds] = useState<Record<number, boolean>>({});

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [requestsData, docksData, repairsData] = await Promise.all([getRepairRequests(), getDocks(), getRepairs()]);
      const linkedRepairs = repairsData.reduce<Record<number, number>>((acc, repair) => {
        acc[repair.shipId] = repair.id;
        return acc;
      }, {});
      setRequests(requestsData);
      setDocks(docksData.map((dock) => ({ id: dock.id, name: dock.name })));
      setRepairIdByRequestId(linkedRepairs);
    } catch {
      setError('Не удалось загрузить очередь заявок');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const queue = useMemo(() => {
    const pending = requests.filter((request) => request.status === 'SUBMITTED' || request.status === 'UNDER_REVIEW');
    if (queueFilter === 'submitted') return pending.filter((request) => request.status === 'SUBMITTED');
    if (queueFilter === 'under_review') return pending.filter((request) => request.status === 'UNDER_REVIEW');
    return pending;
  }, [queueFilter, requests]);

  const processedRequests = useMemo(
    () =>
      requests
        .filter((request) => request.status !== 'SUBMITTED' && request.status !== 'UNDER_REVIEW')
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [requests]
  );

  const normalizedSearch = search.trim().toLowerCase();
  const matchesSearch = (request: RepairRequestResponse) => {
    if (!normalizedSearch) return true;
    return (
      request.shipName.toLowerCase().includes(normalizedSearch) ||
      request.clientName.toLowerCase().includes(normalizedSearch) ||
      String(request.id).includes(normalizedSearch) ||
      (request.assignedDockName ?? '').toLowerCase().includes(normalizedSearch) ||
      (request.assignedOperatorName ?? '').toLowerCase().includes(normalizedSearch)
    );
  };

  const visibleQueue = useMemo(() => queue.filter(matchesSearch), [queue, normalizedSearch]);
  const visibleHistory = useMemo(() => {
    const byHistoryFilter = processedRequests.filter((request) => {
      if (historyFilter === 'all') return true;
      if (historyFilter === 'approved') return request.status === 'APPROVED';
      if (historyFilter === 'rejected') return request.status === 'REJECTED';
      return ['IN_PROGRESS', 'COMPLETED', 'CLIENT_ACCEPTED'].includes(request.status);
    });
    return byHistoryFilter.filter(matchesSearch);
  }, [processedRequests, historyFilter, normalizedSearch]);

  const isSlaOverdue = (request: RepairRequestResponse): boolean => {
    const createdAt = new Date(request.createdAt);
    if (Number.isNaN(createdAt.getTime())) return false;
    return Date.now() - createdAt.getTime() > 2 * 24 * 60 * 60 * 1000;
  };

  const handleUnderReview = async (requestId: number) => {
    setError(null);
    setNotice(null);
    setRequestActionLoadingId(requestId);
    try {
      await updateRepairRequestStatus(requestId, { status: 'UNDER_REVIEW' });
      setNotice(`Заявка #${requestId} принята в рассмотрение.`);
      await loadData();
    } catch (error) {
      setError(extractApiErrorMessage(error) ?? 'Не удалось принять заявку в рассмотрение');
    } finally {
      setRequestActionLoadingId(null);
    }
  };

  const handleApprove = async (requestId: number) => {
    const dockId = Number(requestDockById[requestId] || 0);
    if (!dockId) {
      setError('Выберите док для согласования заявки');
      return;
    }
    setError(null);
    setNotice(null);
    setRequestActionLoadingId(requestId);
    try {
      const updated = await updateRepairRequestStatus(requestId, { status: 'APPROVED', assignedDockId: dockId });
      setNotice(
        `Заявка #${requestId} согласована: док ${updated.assignedDockName ?? '-'}, оператор ${updated.assignedOperatorName ?? '-'}`
      );
      await loadData();
    } catch (error) {
      const message = extractApiErrorMessage(error);
      setError(message ?? 'Не удалось согласовать заявку');
    } finally {
      setRequestActionLoadingId(null);
    }
  };

  const handleReject = async (requestId: number) => {
    const reason = (requestRejectReasonById[requestId] || '').trim();
    if (!reason) {
      setError('Укажите причину отказа');
      return;
    }
    setError(null);
    setNotice(null);
    setRequestActionLoadingId(requestId);
    try {
      await updateRepairRequestStatus(requestId, { status: 'REJECTED', rejectionReason: reason });
      setNotice(`Заявка #${requestId} отклонена.`);
      await loadData();
    } catch (error) {
      setError(extractApiErrorMessage(error) ?? 'Не удалось отклонить заявку');
    } finally {
      setRequestActionLoadingId(null);
    }
  };

  const toggleExpanded = (requestId: number) => {
    setExpandedRequestIds((prev) => ({ ...prev, [requestId]: !prev[requestId] }));
  };

  return (
    <div className="space-y-6">
      <V7PageHeader
        title="Очередь заявок"
        description="Диспетчерская обработка входящих заявок и назначение по докам."
        actions={<Button variant="secondary" onClick={() => navigate('/repairs')}>К ремонтам</Button>}
      />

      {error && <div className="px-4 py-3 rounded-lg border bg-[var(--danger-bg)] border-[var(--danger-line)] text-[var(--danger-ink)]">{error}</div>}
      {notice && <div className="px-4 py-3 rounded-lg border bg-[var(--soft)] border-[var(--line)] text-[var(--ink)]">{notice}</div>}
      {loading && <div className="px-4 py-3 rounded-lg border bg-[var(--soft)] border-[var(--line)] text-[var(--muted)]">Загрузка...</div>}

      <V7Panel>
        <V7PanelTitle title={viewMode === 'queue' ? `Заявки в очереди (${visibleQueue.length})` : `История решений (${visibleHistory.length})`} />
        <div className="mb-3 flex flex-wrap gap-2">
          <Button size="sm" variant={viewMode === 'queue' ? 'primary' : 'outline'} onClick={() => setViewMode('queue')}>Очередь</Button>
          <Button size="sm" variant={viewMode === 'history' ? 'primary' : 'outline'} onClick={() => setViewMode('history')}>История</Button>
          {viewMode === 'queue' && (
            <>
              <Button size="sm" variant={queueFilter === 'all' ? 'primary' : 'outline'} onClick={() => setQueueFilter('all')}>Все</Button>
              <Button size="sm" variant={queueFilter === 'submitted' ? 'primary' : 'outline'} onClick={() => setQueueFilter('submitted')}>Новые</Button>
              <Button size="sm" variant={queueFilter === 'under_review' ? 'primary' : 'outline'} onClick={() => setQueueFilter('under_review')}>На рассмотрении</Button>
            </>
          )}
          {viewMode === 'history' && (
            <>
              <Button size="sm" variant={historyFilter === 'all' ? 'primary' : 'outline'} onClick={() => setHistoryFilter('all')}>Все</Button>
              <Button size="sm" variant={historyFilter === 'approved' ? 'primary' : 'outline'} onClick={() => setHistoryFilter('approved')}>Согласованы</Button>
              <Button size="sm" variant={historyFilter === 'rejected' ? 'primary' : 'outline'} onClick={() => setHistoryFilter('rejected')}>Отклонены</Button>
              <Button size="sm" variant={historyFilter === 'in_progress' ? 'primary' : 'outline'} onClick={() => setHistoryFilter('in_progress')}>В работе</Button>
            </>
          )}
        </div>
        <div className="mb-3">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по судну, клиенту, № заявки, доку, оператору"
            className="w-full md:w-[440px] px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)]"
          />
        </div>
        {(viewMode === 'queue' ? visibleQueue.length : visibleHistory.length) === 0 ? (
          <div className="text-sm text-[var(--muted)]">
            {viewMode === 'queue' ? 'Новых заявок нет.' : 'Обработанных заявок пока нет.'}
          </div>
        ) : (
          <div className="space-y-3">
            {(viewMode === 'queue' ? visibleQueue : visibleHistory).map((request) => (
              <div key={request.id} className="border border-[var(--line)] rounded-lg p-4 bg-white">
                {viewMode === 'queue' ? (
                  <>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div>
                        <div className="font-semibold text-[var(--ink)]">{request.shipName}</div>
                        <div className="text-sm text-[var(--muted)]">Заявка #{request.id} • {request.clientName}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <V7StateText value={REPAIR_REQUEST_STATUS_LABELS[request.status] ?? request.status} />
                        <span className={`text-xs px-2 py-1 rounded border ${
                          isSlaOverdue(request)
                            ? 'border-[var(--danger-line)] text-[var(--danger-ink)] bg-[var(--danger-bg)]'
                            : 'border-[var(--line)] text-[var(--muted)] bg-[var(--soft)]'
                        }`}>
                          {isSlaOverdue(request) ? 'Просрочка обработки > 2 дней' : 'Обработка в срок'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 items-end">
                      <div className="lg:col-span-5">
                        <label className="block text-xs text-[var(--muted)] mb-1">Док для назначения</label>
                        <select
                          value={requestDockById[request.id] || ''}
                          onChange={(e) => setRequestDockById((prev) => ({ ...prev, [request.id]: e.target.value }))}
                          className="w-full h-11 px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)]"
                        >
                          <option value="">Выберите док</option>
                          {docks.map((dock) => (
                            <option key={dock.id} value={dock.id}>{dock.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="lg:col-span-5">
                        <label className="block text-xs text-[var(--muted)] mb-1">Причина отказа</label>
                        <input
                          type="text"
                          value={requestRejectReasonById[request.id] || ''}
                          onChange={(e) => setRequestRejectReasonById((prev) => ({ ...prev, [request.id]: e.target.value }))}
                          className="w-full h-11 px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)]"
                          placeholder="Например: нет окна докования"
                        />
                      </div>
                      <div className="lg:col-span-2 flex flex-wrap gap-2 lg:justify-end">
                        {canRunRepairRequestAction('dispatcher', request.status, 'send_to_review') && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => void handleUnderReview(request.id)}
                            disabled={requestActionLoadingId === request.id}
                          >
                            В рассмотрение
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => void handleApprove(request.id)}
                          disabled={
                            requestActionLoadingId === request.id ||
                            !canRunRepairRequestAction('dispatcher', request.status, 'approve') ||
                            !requestDockById[request.id]
                          }
                        >
                          Согласовать
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void handleReject(request.id)}
                          disabled={requestActionLoadingId === request.id || !canRunRepairRequestAction('dispatcher', request.status, 'reject')}
                        >
                          Отклонить
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => toggleExpanded(request.id)}>
                        {expandedRequestIds[request.id] ? 'Скрыть детали' : 'Детали'}
                      </Button>
                      {repairIdByRequestId[request.id] && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/repairs/${repairIdByRequestId[request.id]}`)}
                        >
                          Открыть ремонт
                        </Button>
                      )}
                    </div>

                    {expandedRequestIds[request.id] && (
                      <div className="mt-3 border-t border-[var(--line)] pt-3">
                        <div className="text-xs text-[var(--muted)] mb-2">
                          Создана: {new Date(request.createdAt).toLocaleString('ru-RU')}
                          {request.requestedStartDate
                            ? ` · Желаемый старт: ${new Date(request.requestedStartDate).toLocaleDateString('ru-RU')}`
                            : ''}
                        </div>
                        <div className="text-sm text-[var(--muted)] mb-2">{request.description || 'Без описания'}</div>
                        {(request.assignedDockName || request.assignedOperatorName || request.rejectionReason) && (
                          <div className="mb-2 text-sm rounded-lg border border-[var(--line)] bg-[var(--soft)] px-3 py-2">
                            {request.rejectionReason ? (
                              <span className="text-[var(--danger-ink)]">Решение: отклонена ({request.rejectionReason})</span>
                            ) : (
                              <span className="text-[var(--ink)]">
                                Решение: док {request.assignedDockName ?? '-'}
                                {request.assignedOperatorName ? `, оператор ${request.assignedOperatorName}` : ''}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          {REQUEST_STEPS.map((step, index) => {
                            const state = getStepState(request.status, step.key, index);
                            return (
                              <div
                                key={step.key}
                                className={`text-xs px-2 py-1 rounded border ${
                                  state === 'done'
                                    ? 'border-[var(--nav)] bg-[var(--soft)] text-[var(--ink)]'
                                    : state === 'current'
                                      ? 'border-[var(--blue)] bg-white text-[var(--blue)]'
                                      : 'border-[var(--line)] bg-white text-[var(--muted)]'
                                }`}
                              >
                                {step.label}
                              </div>
                            );
                          })}
                          {request.status === 'REJECTED' && (
                            <div className="text-xs px-2 py-1 rounded border border-[var(--danger-line)] bg-[var(--danger-bg)] text-[var(--danger-ink)]">
                              Отклонена
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div>
                        <div className="font-semibold text-[var(--ink)]">{request.shipName}</div>
                        <div className="text-sm text-[var(--muted)]">Заявка #{request.id} • {request.clientName}</div>
                        <div className="text-xs text-[var(--muted)] mt-1">
                          Создана: {new Date(request.createdAt).toLocaleString('ru-RU')}
                          {request.requestedStartDate
                            ? ` · Желаемый старт: ${new Date(request.requestedStartDate).toLocaleDateString('ru-RU')}`
                            : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <V7StateText value={REPAIR_REQUEST_STATUS_LABELS[request.status] ?? request.status} />
                        <span className={`text-xs px-2 py-1 rounded border ${
                          isSlaOverdue(request)
                            ? 'border-[var(--danger-line)] text-[var(--danger-ink)] bg-[var(--danger-bg)]'
                            : 'border-[var(--line)] text-[var(--muted)] bg-[var(--soft)]'
                        }`}>
                          {isSlaOverdue(request) ? 'Просрочка обработки > 2 дней' : 'Обработка в срок'}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-[var(--muted)] mb-3">{request.description || 'Без описания'}</div>
                    {(request.assignedDockName || request.assignedOperatorName || request.rejectionReason) && (
                      <div className="mb-3 text-sm rounded-lg border border-[var(--line)] bg-[var(--soft)] px-3 py-2">
                        {request.rejectionReason ? (
                          <span className="text-[var(--danger-ink)]">Решение: отклонена ({request.rejectionReason})</span>
                        ) : (
                          <span className="text-[var(--ink)]">
                            Решение: док {request.assignedDockName ?? '-'}
                            {request.assignedOperatorName ? `, оператор ${request.assignedOperatorName}` : ''}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      {REQUEST_STEPS.map((step, index) => {
                        const state = getStepState(request.status, step.key, index);
                        return (
                          <div
                            key={step.key}
                            className={`text-xs px-2 py-1 rounded border ${
                              state === 'done'
                                ? 'border-[var(--nav)] bg-[var(--soft)] text-[var(--ink)]'
                                : state === 'current'
                                  ? 'border-[var(--blue)] bg-white text-[var(--blue)]'
                                  : 'border-[var(--line)] bg-white text-[var(--muted)]'
                            }`}
                          >
                            {step.label}
                          </div>
                        );
                      })}
                      {request.status === 'REJECTED' && (
                        <div className="text-xs px-2 py-1 rounded border border-[var(--danger-line)] bg-[var(--danger-bg)] text-[var(--danger-ink)]">
                          Отклонена
                        </div>
                      )}
                    </div>
                    {repairIdByRequestId[request.id] && (
                      <div className="mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/repairs/${repairIdByRequestId[request.id]}`)}
                        >
                          Открыть ремонт
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </V7Panel>
    </div>
  );
}
