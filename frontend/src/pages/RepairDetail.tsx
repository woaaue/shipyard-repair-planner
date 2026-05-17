import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, Flag } from 'lucide-react';
import Button from '../components/ui/Button';
import ProgressCircle from '../components/ui/ProgressCircle';
import Modal from '../components/ui/Modal';
import { useAuth, type User } from '../context/AuthContext';
import {
  getRepair,
  updateRepairPriority,
  updateRepairStatus,
} from '../services/repairs';
import { acceptRepairRequestByClient, getRepairRequest, type RepairRequestResponse } from '../services/repairRequests';
import { createWorkItem, getWorkItems, type WorkCategory } from '../services/workItems';
import { getSubordinates, getUsers } from '../services/users';
import type { ExtendedRepair } from '../types/repair';
import { WORK_REVIEW_STATUS_LABELS } from '../constants/labels';
import V7PageHeader from '../components/v7/V7PageHeader';
import V7Panel from '../components/v7/V7Panel';
import V7PanelTitle from '../components/v7/V7PanelTitle';
import V7StateText from '../components/v7/V7StateText';
import {
  canAcceptRepairByClient,
  getNextRepairStatus,
  toBackendRepairStatus,
} from '../domain/workflow/repairWorkflow';
import { formatDateRangeRu, normalizeDateOnly } from '../utils/repairDates';

const PRIORITIES = ['низкий', 'средний', 'высокий', 'критический'] as const;

export default function RepairDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [repair, setRepair] = useState<ExtendedRepair | null>(null);
  const [repairRequest, setRepairRequest] = useState<RepairRequestResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [newPriority, setNewPriority] = useState<string>('средний');
  const [isPrioritySaving, setIsPrioritySaving] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [isTaskSaving, setIsTaskSaving] = useState(false);
  const [workerOptions, setWorkerOptions] = useState<User[]>([]);
  const [taskForm, setTaskForm] = useState({
    name: '',
    category: 'OTHER' as WorkCategory,
    estimatedHours: '1',
    description: '',
    assigneeId: '',
    isMandatory: false,
  });

  const repairId = Number(id || '0');

  const loadRepair = async () => {
    if (!repairId) {
      setRepair(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const baseRepair = await getRepair(repairId);
      const [request, workItems] = await Promise.all([
        getRepairRequest(baseRepair.shipId).catch(() => null),
        getWorkItems({ repairId }),
      ]);

      const tasks = workItems.map((item) => ({
        id: item.id,
        name: item.name,
        completed: item.reviewStatus === 'APPROVED',
        estimatedHours: item.estimatedHours,
        actualHours: item.actualHours,
        worker: item.assigneeFullName ?? 'Не назначен',
        reviewStatus: item.reviewStatus,
      }));

      const completedTasks = tasks.filter((task) => task.completed).length;
      let progressFromTasks =
        tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : baseRepair.progress;

      if (baseRepair.status === 'завершён') {
        progressFromTasks = 100;
      }

      if (baseRepair.status === 'отменён') {
        progressFromTasks = 0;
      }

      const mapped: ExtendedRepair = {
        ...baseRepair,
        shipName: request?.shipName ?? baseRepair.shipName,
        startDate:
          normalizeDateOnly(baseRepair.actualStartDate ?? baseRepair.startDate) ??
          normalizeDateOnly(request?.scheduledStartDate ?? request?.requestedStartDate) ??
          '',
        endDate:
          normalizeDateOnly(baseRepair.actualEndDate ?? baseRepair.endDate) ??
          normalizeDateOnly(request?.scheduledEndDate ?? request?.requestedEndDate) ??
          '',
        plannedStartDate: normalizeDateOnly(request?.scheduledStartDate ?? request?.requestedStartDate) ?? undefined,
        plannedEndDate: normalizeDateOnly(request?.scheduledEndDate ?? request?.requestedEndDate) ?? undefined,
        repairType: (tasks.length > 0 ? 'Текущий ремонт' : 'Доковый ремонт') as ExtendedRepair['repairType'],
        priority: baseRepair.priority,
        manager: 'Не назначен',
        requestStatus: request?.status,
        clientAccepted: request?.clientAccepted ?? false,
        progress: progressFromTasks,
        tasks,
      };

      setRepair(mapped);
      setRepairRequest(request);
      setNewPriority(mapped.priority);
    } catch {
      setRepair(null);
      setRepairRequest(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRepair();
  }, [repairId]);

  useEffect(() => {
    const loadWorkers = async () => {
      if (!user) {
        setWorkerOptions([]);
        return;
      }

      try {
        if (user.role === 'admin') {
          const allUsers = await getUsers({ role: 'worker' });
          setWorkerOptions(allUsers);
          return;
        }

        if (
          (user.role === 'master' || user.role === 'operator' || user.role === 'dispatcher') &&
          typeof user.id === 'number'
        ) {
          const subordinates = await getSubordinates(user.id);
          setWorkerOptions(subordinates.filter((member) => member.role === 'worker'));
          return;
        }

        setWorkerOptions([]);
      } catch {
        setWorkerOptions([]);
      }
    };

    void loadWorkers();
  }, [user]);

  const completedTasks = useMemo(
    () => repair?.tasks.filter((task) => task.completed).length ?? 0,
    [repair]
  );

  if (isLoading) {
    return <div className="text-center py-12 text-[var(--muted)]">Загрузка...</div>;
  }

  if (!repair) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-[var(--ink)]">Ремонт не найден</h2>
        <Button onClick={() => navigate('/repairs')} className="mt-4">
          Вернуться к списку
        </Button>
      </div>
    );
  }

  const canEdit =
    user?.role === 'admin' ||
    user?.role === 'dispatcher' ||
    (user?.role === 'operator' && typeof user.id === 'number' && repair.operatorId === user.id) ||
    (user?.role === 'master' && user.dock === repair.dock);

  const canAcceptByClient =
    canAcceptRepairByClient(user?.role, {
      currentUserId: user?.id,
      requestClientId: repairRequest?.clientId,
      repairStatus: repair.status,
      clientAccepted: Boolean(repair.clientAccepted),
      taskCount: repair.tasks.length,
      allTasksApproved: repair.tasks.every((task) => task.reviewStatus === 'APPROVED'),
    });
  const backPath = user?.role === 'worker' ? '/tasks' : '/repairs';
  const backLabel = user?.role === 'worker' ? 'К задачам' : 'К списку';

  const handleStatusUpdate = async () => {
    setActionError(null);
    setIsStatusUpdating(true);
    try {
      const nextStatus = getNextRepairStatus(repair.status);
      await updateRepairStatus(repair.id, toBackendRepairStatus(nextStatus));
      await loadRepair();
    } catch {
      setActionError('Не удалось обновить статус ремонта');
    } finally {
      setIsStatusUpdating(false);
    }
  };

  const handleClientAcceptance = async () => {
    if (!repairRequest) return;
    setActionError(null);
    setIsAccepting(true);
    try {
      await acceptRepairRequestByClient(repairRequest.id);
      await loadRepair();
    } catch {
      setActionError('Не удалось подтвердить приемку ремонта');
    } finally {
      setIsAccepting(false);
    }
  };

  const handlePrioritySave = async () => {
    if (!repair) return;
    setActionError(null);
    setIsPrioritySaving(true);
    try {
      await updateRepairPriority(repair.id, newPriority as ExtendedRepair['priority']);
      await loadRepair();
      setShowPriorityModal(false);
    } catch {
      setActionError('Не удалось сохранить приоритет ремонта');
    } finally {
      setIsPrioritySaving(false);
    }
  };

  const handleCreateTask = async () => {
    if (!repair) return;
    setActionError(null);

    if (!taskForm.name.trim()) {
      setActionError('Укажите название задачи');
      return;
    }

    const estimatedHours = Number(taskForm.estimatedHours);
    if (!Number.isFinite(estimatedHours) || estimatedHours < 0) {
      setActionError('Плановые часы должны быть числом не меньше 0');
      return;
    }

    setIsTaskSaving(true);
    try {
      await createWorkItem({
        repairRequestId: repair.shipId,
        repairId: repair.id,
        assigneeId: taskForm.assigneeId ? Number(taskForm.assigneeId) : null,
        category: taskForm.category,
        name: taskForm.name.trim(),
        description: taskForm.description.trim() || null,
        status: 'PENDING',
        estimatedHours,
        actualHours: 0,
        isMandatory: taskForm.isMandatory,
        isDiscovered: false,
        notes: null,
      });

      setShowCreateTaskModal(false);
      setTaskForm({
        name: '',
        category: 'OTHER',
        estimatedHours: '1',
        description: '',
        assigneeId: '',
        isMandatory: false,
      });
      await loadRepair();
    } catch {
      setActionError('Не удалось создать задачу');
    } finally {
      setIsTaskSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <V7PageHeader
        title={repair.shipName}
        description={`Ремонт #${repair.id} · Док: ${repair.dock}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => navigate(backPath)} icon={ArrowLeft}>
              {backLabel}
            </Button>
            <V7StateText value={String(repair.status).toUpperCase()} />
          </div>
        }
      />
      {actionError && <div className="px-4 py-3 rounded-lg border bg-[var(--danger-bg)] border-[var(--danger-line)] text-[var(--danger-ink)]">{actionError}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <V7Panel>
            <V7PanelTitle title="Информация о ремонте" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-[var(--muted)]">Тип ремонта</div>
                <div className="font-medium">{repair.repairType}</div>
              </div>
              <div>
                <div className="text-sm text-[var(--muted)]">Док</div>
                <div className="font-medium">{repair.dock}</div>
              </div>
              <div>
                <div className="text-sm text-[var(--muted)]">Сроки</div>
                <div className="font-medium">{formatDateRangeRu(repair.startDate, repair.endDate)}</div>
              </div>
              <div>
                <div className="text-sm text-[var(--muted)]">Оператор ремонта</div>
                <div className="font-medium">{repair.manager}</div>
              </div>
              <div>
                <div className="text-sm text-[var(--muted)]">Заявка на ремонт</div>
                <div className="font-medium">#{repair.shipId}</div>
              </div>
            </div>
          </V7Panel>

          <V7Panel>
            <V7PanelTitle
              title={`Задачи (${completedTasks}/${repair.tasks.length})`}
             
              extra={
                canEdit ? (
                  <Button size="sm" variant="secondary" onClick={() => setShowCreateTaskModal(true)}>
                    Новая задача
                  </Button>
                ) : null
              }
            />
            <div className="space-y-3">
              {repair.tasks.length === 0 && (
                <div className="text-sm text-[var(--muted)]">По этому ремонту пока нет задач.</div>
              )}
              {repair.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-4 p-3 border border-[var(--line)] rounded-lg hover:bg-[var(--soft)] cursor-pointer"
                  onClick={() => navigate(`/repairs/${repair.id}/tasks/${task.id}`)}
                >
                  <div className={`p-2 rounded-full ${task.completed ? 'bg-[var(--soft)] border border-[var(--line)]' : 'bg-[var(--soft)]'}`}>
                    {task.completed ? (
                      <CheckCircle className="h-4 w-4 text-[var(--ink)]" />
                    ) : (
                      <Clock className="h-4 w-4 text-[var(--muted)]" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium ${task.completed ? 'text-[var(--muted)] line-through' : ''}`}>
                      {task.name}
                    </div>
                    <div className="text-sm text-[var(--muted)]">
                      {task.worker}
                      {task.reviewStatus ? ` • ${WORK_REVIEW_STATUS_LABELS[task.reviewStatus] ?? task.reviewStatus}` : ''}
                    </div>
                  </div>
                  <div className="text-sm text-[var(--muted)]">{task.actualHours || task.estimatedHours} ч</div>
                </div>
              ))}
            </div>
          </V7Panel>
        </div>

        <div className="space-y-6">
          <V7Panel>
            <V7PanelTitle title="Прогресс" />
            <div className="flex justify-center">
              <ProgressCircle progress={repair.progress} size={120} />
            </div>
          </V7Panel>

          {canEdit && (
            <V7Panel>
              <V7PanelTitle title="Действия" />
              <div className="space-y-2">
                <Button variant="secondary" className="w-full" onClick={() => setShowPriorityModal(true)}>
                  <Flag className="h-4 w-4 mr-2" />
                  Изменить приоритет
                </Button>
                <div className="text-xs text-[var(--muted)] px-1">
                  Назначение дока редактируется в отдельном процессе диспетчеризации.
                </div>
                {user?.role !== 'client' && (
                  <Button className="w-full" onClick={handleStatusUpdate} disabled={isStatusUpdating}>
                    {isStatusUpdating ? 'Обновление...' : 'Обновить статус'}
                  </Button>
                )}
              </div>
            </V7Panel>
          )}

          {user?.role === 'client' && (
            <V7Panel>
              <V7PanelTitle title="Приемка клиента" />
              <div className="space-y-3 text-sm">
                <div className="text-[var(--muted)]">
                  Статус: {repair.clientAccepted ? 'Принято клиентом' : 'Не принято'}
                </div>
                {canAcceptByClient ? (
                  <Button className="w-full" onClick={handleClientAcceptance} disabled={isAccepting}>
                    {isAccepting ? 'Подтверждение...' : 'Подтвердить приемку'}
                  </Button>
                ) : (
                  <div className="text-[var(--muted)]">
                    {repair.clientAccepted ? 'Действие не требуется.' : 'Приемка станет доступна после завершения и проверки всех работ.'}
                  </div>
                )}
              </div>
            </V7Panel>
          )}
        </div>
      </div>

      {showPriorityModal && (
        <Modal isOpen={showPriorityModal} onClose={() => setShowPriorityModal(false)} title="Изменить приоритет" icon={Flag}>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--muted)] mb-1">Приоритет</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
              >
                {PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="secondary" className="flex-1" onClick={() => setShowPriorityModal(false)}>
                Отмена
              </Button>
              <Button className="flex-1" onClick={handlePrioritySave} disabled={isPrioritySaving}>
                {isPrioritySaving ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showCreateTaskModal && (
        <Modal isOpen={showCreateTaskModal} onClose={() => setShowCreateTaskModal(false)} title="Новая задача">
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--muted)] mb-1">Название *</label>
              <input
                type="text"
                value={taskForm.name}
                onChange={(e) => setTaskForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--muted)] mb-1">Категория *</label>
              <select
                value={taskForm.category}
                onChange={(e) => setTaskForm((prev) => ({ ...prev, category: e.target.value as WorkCategory }))}
                className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
              >
                <option value="HULL">Корпус</option>
                <option value="MECHANICAL">Механика</option>
                <option value="ELECTRICAL">Электрика</option>
                <option value="PAINTING">Окраска</option>
                <option value="PIPING">Трубопроводы</option>
                <option value="VALVES">Арматура</option>
                <option value="PROPULSION">Движитель</option>
                <option value="STEEL">Металлоконструкции</option>
                <option value="TANKS">Танки/цистерны</option>
                <option value="SAFETY">Безопасность</option>
                <option value="OTHER">Другое</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--muted)] mb-1">Плановые часы</label>
              <input
                type="number"
                min={0}
                value={taskForm.estimatedHours}
                onChange={(e) => setTaskForm((prev) => ({ ...prev, estimatedHours: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--muted)] mb-1">Исполнитель</label>
              <select
                value={taskForm.assigneeId}
                onChange={(e) => setTaskForm((prev) => ({ ...prev, assigneeId: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
              >
                <option value="">Не назначен</option>
                {workerOptions.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--muted)] mb-1">Описание</label>
              <textarea
                rows={3}
                value={taskForm.description}
                onChange={(e) => setTaskForm((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-[var(--ink)]">
              <input
                type="checkbox"
                checked={taskForm.isMandatory}
                onChange={(e) => setTaskForm((prev) => ({ ...prev, isMandatory: e.target.checked }))}
              />
              Обязательная задача
            </label>
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => setShowCreateTaskModal(false)}>
                Отмена
              </Button>
              <Button className="flex-1" onClick={() => void handleCreateTask()} disabled={isTaskSaving}>
                {isTaskSaving ? 'Сохранение...' : 'Создать задачу'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

