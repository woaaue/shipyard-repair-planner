import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { getRepairRequest, resubmitRepairRequestByClient, type RepairRequestResponse } from '../services/repairRequests';
import { getRepairs } from '../services/repairs';
import V7PageHeader from '../components/v7/V7PageHeader';
import V7Panel from '../components/v7/V7Panel';
import V7PanelTitle from '../components/v7/V7PanelTitle';
import V7StateText from '../components/v7/V7StateText';
import { REPAIR_REQUEST_STATUS_LABELS } from '../constants/labels';
import { canClientResubmitRequest } from '../domain/workflow/repairRequestWorkflow';

const CLIENT_REQUEST_FLOW: Array<{
  key: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CLIENT_ACCEPTED' | 'REJECTED';
  label: string;
}> = [
  { key: 'SUBMITTED', label: 'Подана' },
  { key: 'UNDER_REVIEW', label: 'На рассмотрении' },
  { key: 'APPROVED', label: 'Согласована' },
  { key: 'IN_PROGRESS', label: 'В работе' },
  { key: 'COMPLETED', label: 'Завершена' },
  { key: 'CLIENT_ACCEPTED', label: 'Принята клиентом' },
];

function getStepState(
  requestStatus: RepairRequestResponse['status'],
  stepKey: (typeof CLIENT_REQUEST_FLOW)[number]['key'],
  stepIndex: number
): 'done' | 'current' | 'pending' {
  if (requestStatus === 'REJECTED') {
    return stepKey === 'UNDER_REVIEW' ? 'done' : stepKey === 'REJECTED' ? 'current' : 'pending';
  }

  const statusOrder: RepairRequestResponse['status'][] = [
    'SUBMITTED',
    'UNDER_REVIEW',
    'APPROVED',
    'IN_PROGRESS',
    'COMPLETED',
    'CLIENT_ACCEPTED',
  ];
  const currentIndex = statusOrder.indexOf(requestStatus);
  if (currentIndex < 0) return 'pending';
  if (stepIndex < currentIndex) return 'done';
  if (stepIndex === currentIndex) return 'current';
  return 'pending';
}

export default function ClientRequestDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [request, setRequest] = useState<RepairRequestResponse | null>(null);
  const [linkedRepairId, setLinkedRepairId] = useState<number | null>(null);
  const [showRequestParams, setShowRequestParams] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id || user?.role !== 'client') return;
      setLoading(true);
      setError(null);
      try {
        const data = await getRepairRequest(Number(id));
        if (typeof user.id === 'number' && data.clientId !== user.id) {
          setError('Нет доступа к этой заявке');
          return;
        }
        const linkedRepairs = await getRepairs({ repairRequestId: data.id });
        setLinkedRepairId(linkedRepairs.length > 0 ? linkedRepairs[0].id : null);
        setRequest(data);
      } catch {
        setError('Не удалось загрузить заявку');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id, user?.id, user?.role]);

  const handleResubmit = async () => {
    if (!request || !canClientResubmitRequest('client', request, user?.id)) return;

    const note = window.prompt('Комментарий к повторной подаче (необязательно):') ?? '';
    setResubmitting(true);
    setError(null);
    try {
      const updated = await resubmitRepairRequestByClient(request.id, note.trim() || undefined);
      setRequest(updated);
    } catch (submissionError: any) {
      const apiMessage = submissionError?.response?.data?.message;
      setError(typeof apiMessage === 'string' && apiMessage.length > 0 ? apiMessage : 'Не удалось повторно подать заявку');
    } finally {
      setResubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <V7PageHeader
        title={request ? `Заявка #${request.id}` : 'Детали заявки'}
        description={request ? request.shipName : 'Карточка заявки клиента'}
        actions={
          <div className="flex gap-2">
            {request && canClientResubmitRequest('client', request, user?.id) && (
              <Button onClick={() => void handleResubmit()} disabled={resubmitting}>
                {resubmitting ? 'Отправка...' : 'Подать повторно'}
              </Button>
            )}
            {linkedRepairId && (
              <Button variant="outline" onClick={() => navigate(`/repairs/${linkedRepairId}`)}>
                Открыть ремонт
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate('/my-requests')}>Назад к списку</Button>
          </div>
        }
      />

      {error && <div className="px-4 py-3 rounded-lg border bg-[var(--danger-bg)] border-[var(--danger-line)] text-[var(--danger-ink)]">{error}</div>}
      {loading && <div className="px-4 py-3 rounded-lg border bg-[var(--soft)] border-[var(--line)] text-[var(--muted)]">Загрузка...</div>}

      {request && (
        <>
          <V7Panel>
            <V7PanelTitle title="Этапы заявки" />
            <div className="space-y-2">
              {CLIENT_REQUEST_FLOW.map((step, index) => {
                const state = getStepState(request.status, step.key, index);
                return (
                  <div key={step.key} className="flex items-center gap-3">
                    <div
                      className={`h-6 w-6 rounded-full border text-xs font-semibold grid place-items-center ${
                        state === 'done'
                          ? 'border-[var(--nav)] bg-[var(--nav)] text-white'
                          : state === 'current'
                            ? 'border-[var(--blue)] bg-white text-[var(--blue)]'
                            : 'border-[var(--line)] bg-white text-[var(--muted)]'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div
                      className={`text-sm ${
                        state === 'current'
                          ? 'font-semibold text-[var(--ink)]'
                          : state === 'done'
                            ? 'text-[var(--ink)]'
                            : 'text-[var(--muted)]'
                      }`}
                    >
                      {step.label}
                    </div>
                  </div>
                );
              })}
              {request.status === 'REJECTED' && (
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full border border-[var(--danger-line)] bg-[var(--danger-bg)] text-[var(--danger-ink)] text-xs font-semibold grid place-items-center">
                    !
                  </div>
                  <div className="text-sm font-semibold text-[var(--danger-ink)]">Отклонена</div>
                </div>
              )}
            </div>
          </V7Panel>

          <V7Panel>
            <V7PanelTitle title="Статус и решение" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-[var(--muted)] mb-1">Текущий статус</div>
                <V7StateText value={REPAIR_REQUEST_STATUS_LABELS[request.status] ?? request.status} />
              </div>
              <div>
                <div className="text-xs text-[var(--muted)] mb-1">Приемка клиентом</div>
                <div className="font-medium text-[var(--ink)]">{request.clientAccepted ? 'Подтверждена' : 'Ожидается'}</div>
              </div>
              <div>
                <div className="text-xs text-[var(--muted)] mb-1">Назначенный док</div>
                <div className="font-medium text-[var(--ink)]">{request.assignedDockName ?? 'Еще не назначен'}</div>
              </div>
              <div>
                <div className="text-xs text-[var(--muted)] mb-1">Ответственный оператор</div>
                <div className="font-medium text-[var(--ink)]">{request.assignedOperatorName ?? 'Еще не назначен'}</div>
              </div>
            </div>
            {request.rejectionReason && (
              <div className="mt-4 px-3 py-2 rounded-lg border border-[var(--danger-line)] bg-[var(--danger-bg)] text-[var(--danger-ink)] text-sm">
                Причина отказа: {request.rejectionReason}
              </div>
            )}
          </V7Panel>

          <V7Panel>
            <div className="flex items-center justify-between gap-3">
              <V7PanelTitle title="Параметры заявки" />
              <Button size="sm" variant="outline" onClick={() => setShowRequestParams((value) => !value)}>
                {showRequestParams ? 'Скрыть' : 'Показать'}
              </Button>
            </div>
            {showRequestParams && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-[var(--muted)]">Судно</div>
                    <div className="font-medium text-[var(--ink)]">{request.shipName}</div>
                  </div>
                  <div>
                    <div className="text-[var(--muted)]">Создана</div>
                    <div className="font-medium text-[var(--ink)]">{new Date(request.createdAt).toLocaleString('ru-RU')}</div>
                  </div>
                  <div>
                    <div className="text-[var(--muted)]">Желаемая дата начала</div>
                    <div className="font-medium text-[var(--ink)]">
                      {request.requestedStartDate ? new Date(request.requestedStartDate).toLocaleDateString('ru-RU') : 'Не указана'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[var(--muted)]">Плановая дата начала</div>
                    <div className="font-medium text-[var(--ink)]">
                      {request.scheduledStartDate ? new Date(request.scheduledStartDate).toLocaleDateString('ru-RU') : 'Не назначена'}
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-sm">
                  <div className="text-[var(--muted)] mb-1">Описание</div>
                  <div className="rounded-lg border border-[var(--line)] bg-white p-3 text-[var(--ink)]">
                    {request.description || 'Описание не добавлено'}
                  </div>
                </div>
              </>
            )}
          </V7Panel>

          <V7Panel>
            <div className="flex items-center justify-between gap-3">
              <V7PanelTitle title="История изменений" />
              <Button size="sm" variant="outline" onClick={() => setShowHistory((value) => !value)}>
                {showHistory ? 'Скрыть' : 'Показать'}
              </Button>
            </div>
            {showHistory && (
              <div className="space-y-2 text-sm">
                <div className="rounded-lg border border-[var(--line)] bg-white p-3">
                  <div className="font-medium text-[var(--ink)]">Заявка создана</div>
                  <div className="text-[var(--muted)]">{new Date(request.createdAt).toLocaleString('ru-RU')}</div>
                </div>

                <div className="rounded-lg border border-[var(--line)] bg-white p-3">
                  <div className="font-medium text-[var(--ink)]">Последнее обновление</div>
                  <div className="text-[var(--muted)]">{new Date(request.updatedAt).toLocaleString('ru-RU')}</div>
                </div>

                {(request.assignedDockName || request.assignedOperatorName) && (
                  <div className="rounded-lg border border-[var(--line)] bg-white p-3">
                    <div className="font-medium text-[var(--ink)]">Назначение по заявке</div>
                    <div className="text-[var(--muted)]">
                      {request.assignedDockName ? `Док: ${request.assignedDockName}` : 'Док не назначен'}
                      {request.assignedOperatorName ? ` · Оператор: ${request.assignedOperatorName}` : ''}
                    </div>
                  </div>
                )}

                {request.rejectionReason && (
                  <div className="rounded-lg border border-[var(--danger-line)] bg-[var(--danger-bg)] p-3">
                    <div className="font-medium text-[var(--danger-ink)]">Заявка отклонена</div>
                    <div className="text-[var(--danger-ink)]">{request.rejectionReason}</div>
                  </div>
                )}

                {request.clientAcceptedAt && (
                  <div className="rounded-lg border border-[var(--line)] bg-white p-3">
                    <div className="font-medium text-[var(--ink)]">Приемка подтверждена клиентом</div>
                    <div className="text-[var(--muted)]">{new Date(request.clientAcceptedAt).toLocaleString('ru-RU')}</div>
                  </div>
                )}
              </div>
            )}
          </V7Panel>
        </>
      )}
    </div>
  );
}
