import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { getRepairRequests, type RepairRequestResponse } from '../services/repairRequests';
import V7PageHeader from '../components/v7/V7PageHeader';
import V7Panel from '../components/v7/V7Panel';
import V7PanelTitle from '../components/v7/V7PanelTitle';
import V7StateText from '../components/v7/V7StateText';
import { REPAIR_REQUEST_STATUS_LABELS } from '../constants/labels';

export default function ClientRequests() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<RepairRequestResponse[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | RepairRequestResponse['status']>('all');

  useEffect(() => {
    const load = async () => {
      if (user?.role !== 'client' || typeof user.id !== 'number') return;
      setLoading(true);
      setError(null);
      try {
        const data = await getRepairRequests({ clientId: user.id });
        setRequests(data);
      } catch {
        setError('Не удалось загрузить заявки');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [user?.id, user?.role]);

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return requests
      .filter((item) => {
        if (statusFilter !== 'all' && item.status !== statusFilter) return false;
        if (!normalized) return true;
        return (
          item.shipName.toLowerCase().includes(normalized) ||
          item.clientName.toLowerCase().includes(normalized) ||
          String(item.id).includes(normalized) ||
          (item.assignedDockName ?? '').toLowerCase().includes(normalized) ||
          (item.assignedOperatorName ?? '').toLowerCase().includes(normalized)
        );
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [requests, search, statusFilter]);

  const uniqueStatuses = useMemo(
    () => ['all', ...new Set(requests.map((item) => item.status))] as Array<'all' | RepairRequestResponse['status']>,
    [requests]
  );

  return (
    <div className="space-y-6">
      <V7PageHeader
        title="Мои заявки"
        description="Отслеживание статусов, решений и назначений по вашим заявкам."
        actions={<Button onClick={() => navigate('/repairs?new=true')}>Новая заявка</Button>}
      />

      {error && <div className="px-4 py-3 rounded-lg border bg-[var(--danger-bg)] border-[var(--danger-line)] text-[var(--danger-ink)]">{error}</div>}
      {loading && <div className="px-4 py-3 rounded-lg border bg-[var(--soft)] border-[var(--line)] text-[var(--muted)]">Загрузка...</div>}

      <V7Panel>
        <V7PanelTitle title="Фильтры" />
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_220px_auto] gap-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск: судно, № заявки, док, оператор"
            className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)]"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'all' | RepairRequestResponse['status'])}
            className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)]"
          >
            {uniqueStatuses.map((status) => (
              <option key={status} value={status}>
                {status === 'all' ? 'Все статусы' : REPAIR_REQUEST_STATUS_LABELS[status] ?? status}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            onClick={() => {
              setSearch('');
              setStatusFilter('all');
            }}
          >
            Сбросить
          </Button>
        </div>
      </V7Panel>

      <V7Panel>
        <V7PanelTitle title={`Заявки (${filtered.length})`} />
        {filtered.length === 0 ? (
          <div className="text-sm text-[var(--muted)]">Заявок пока нет.</div>
        ) : (
          <div className="space-y-2">
            {filtered.map((request) => (
              <button
                key={request.id}
                type="button"
                onClick={() => navigate(`/my-requests/${request.id}`)}
                className="w-full text-left border border-[var(--line)] rounded-lg p-3 bg-white hover:bg-[var(--soft)]"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="font-semibold text-[var(--ink)]">
                    {request.shipName}
                    <span className="ml-2 text-[var(--muted)] font-medium">#{request.id}</span>
                  </div>
                  <V7StateText value={REPAIR_REQUEST_STATUS_LABELS[request.status] ?? request.status} />
                </div>
                <div className="text-sm text-[var(--muted)] flex flex-wrap gap-x-3 gap-y-1">
                  {request.assignedDockName ? `Док: ${request.assignedDockName}` : ''}
                  {request.assignedOperatorName ? `Оператор: ${request.assignedOperatorName}` : ''}
                  <span>Обновлена: {new Date(request.updatedAt).toLocaleDateString('ru-RU')}</span>
                </div>
                {request.rejectionReason && (
                  <div className="text-sm text-[var(--danger-ink)] mt-2">
                    Причина отказа: {request.rejectionReason}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </V7Panel>
    </div>
  );
}
