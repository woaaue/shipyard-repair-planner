import { useEffect, useMemo, useState } from 'react';
import {
  CloudOff,
} from 'lucide-react';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import DowntimeForm from '../components/forms/DowntimeForm';
import { getRepairs, updateRepairStatus } from '../services/repairs';
import type { ExtendedRepair } from '../types/repair';
import type { BackendRepairStatus } from '../services/repairs';
import V7PageHeader from '../components/v7/V7PageHeader';
import V7Panel from '../components/v7/V7Panel';
import V7PanelTitle from '../components/v7/V7PanelTitle';
import { deriveBackendStatusFromProgress } from '../domain/workflow/repairWorkflow';
import { formatDateRangeRu } from '../utils/repairDates';

const STATUS_LABELS: Record<BackendRepairStatus, string> = {
  SCHEDULED: 'Запланирован',
  STARTED: 'Начат',
  IN_PROGRESS: 'В работе',
  QA: 'Проверка',
  COMPLETED: 'Завершен',
  CANCELLED: 'Отменен',
};

export default function OperatorDock() {
  const { user } = useAuth();
  const [selectedRepairId, setSelectedRepairId] = useState<number | null>(null);
  const [showDowntimeForm, setShowDowntimeForm] = useState(false);
  const [repairs, setRepairs] = useState<ExtendedRepair[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const userDock = user?.dock ?? 'Док не назначен';

  const loadRepairs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data =
        user?.role === 'operator' && typeof user.id === 'number'
          ? await getRepairs({ operatorId: user.id })
          : await getRepairs();
      setRepairs(data);
    } catch {
      setError('Не удалось загрузить ремонты дока.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRepairs();
  }, [user?.id, user?.role]);

  const dockRepairs = useMemo(() => {
    if (user?.role === 'operator') {
      return repairs;
    }
    return repairs.filter((repair) => repair.dock === userDock);
  }, [repairs, user?.role, userDock]);
  const activeRepairs = useMemo(
    () => dockRepairs.filter((repair) => repair.progress > 0 && repair.progress < 100),
    [dockRepairs]
  );
  const plannedRepairs = useMemo(
    () => dockRepairs.filter((repair) => repair.progress <= 0),
    [dockRepairs]
  );
  const completedRepairs = useMemo(
    () => dockRepairs.filter((repair) => repair.progress >= 100),
    [dockRepairs]
  );

  const loadPercentage = Math.min(100, Math.round((activeRepairs.length / 3) * 100));
  const handleConfirmPlacement = async (repairId: number) => {
    setNotice(null);
    try {
      await updateRepairStatus(repairId, 'IN_PROGRESS');
      await loadRepairs();
      setNotice(`Ремонт #${repairId} переведен в статус "В работе".`);
    } catch {
      setError('Не удалось обновить статус ремонта.');
    } finally {
      setSelectedRepairId(null);
    }
  };

  const handleUpdateStatus = async (repairId: number, newStatus: BackendRepairStatus) => {
    setNotice(null);
    try {
      await updateRepairStatus(repairId, newStatus);
      await loadRepairs();
      setNotice('Статус ремонта обновлен.');
    } catch {
      setError('Не удалось обновить статус ремонта.');
    }
  };

  return (
    <div className="space-y-6">
      <V7PageHeader
        title="Док оператора и зона ответственности"
        description={`Док: ${userDock}. Управление ремонтами и операциями по статусам в зоне оператора.`}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowDowntimeForm(true)}>
              <CloudOff className="h-4 w-4 mr-2" />
              Простой
            </Button>
          </div>
        }
      />

      {error && <div className="px-4 py-3 rounded-lg border bg-[var(--danger-bg)] border-[var(--danger-line)] text-[var(--danger-ink)]">{error}</div>}
      {notice && <div className="px-4 py-3 rounded-lg border border-[var(--line)] bg-[var(--soft)] text-[var(--ink)]">{notice}</div>}

      <V7Panel>
        <V7PanelTitle title="Сводка по доку" />
        <p className="text-sm text-[var(--muted)]">
          В работе: {activeRepairs.length} · Запланировано: {plannedRepairs.length} · Завершено:{' '}
          {completedRepairs.length} · Загрузка: {loadPercentage}%
        </p>
      </V7Panel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <V7Panel>
          <V7PanelTitle title={`Текущие ремонты (${activeRepairs.length})`} />
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-[var(--muted)] text-center py-4">Загрузка...</div>
            ) : activeRepairs.length === 0 ? (
              <div className="text-[var(--muted)] text-center py-4">Нет активных ремонтов</div>
            ) : (
              activeRepairs.map((repair) => (
                <div key={repair.id} className="p-4 border border-[var(--line)] rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-medium">{repair.shipName}</div>
                      <div className="text-sm text-[var(--muted)]">
                        {formatDateRangeRu(repair.startDate, repair.endDate)}
                      </div>
                    </div>
                    <select
                      value={deriveBackendStatusFromProgress(repair)}
                      onChange={(e) => handleUpdateStatus(repair.id, e.target.value as BackendRepairStatus)}
                      className="text-sm border border-[var(--line-strong)] rounded px-2 py-1 bg-white text-[var(--ink)]"
                    >
                      {Object.keys(STATUS_LABELS).map((status) => (
                        <option key={status} value={status}>
                          {STATUS_LABELS[status as BackendRepairStatus]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[var(--muted)]">
                    <span>Прогресс: {repair.progress}%</span>
                    <span>Оператор ремонта: {repair.manager}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </V7Panel>

        <V7Panel>
          <V7PanelTitle title={`Запланированные ремонты (${plannedRepairs.length})`} />
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-[var(--muted)] text-center py-4">Загрузка...</div>
            ) : plannedRepairs.length === 0 ? (
              <div className="text-[var(--muted)] text-center py-4">Нет запланированных ремонтов</div>
            ) : (
              plannedRepairs.map((repair) => (
                <div key={repair.id} className="p-4 border border-[var(--line)] rounded-lg bg-[var(--soft)]">
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-medium">{repair.shipName}</div>
                    <Button size="sm" onClick={() => setSelectedRepairId(repair.id)}>
                      Подтвердить постановку
                    </Button>
                  </div>
                  <div className="text-sm text-[var(--muted)]">
                    {formatDateRangeRu(repair.startDate, repair.endDate)}
                  </div>
                </div>
              ))
            )}
          </div>
        </V7Panel>
      </div>

      {selectedRepairId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Подтверждение постановки судна</h3>
            <div className="space-y-4">
              <div className="text-sm text-[var(--muted)]">
                После подтверждения ремонт перейдет в статус «В работе».
              </div>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setSelectedRepairId(null);
                  }}
                >
                  Отмена
                </Button>
                <Button className="flex-1" onClick={() => handleConfirmPlacement(selectedRepairId)}>
                  Подтвердить
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDowntimeForm && <DowntimeForm onClose={() => setShowDowntimeForm(false)} dockName={userDock} />}
    </div>
  );
}

