import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import V7PageHeader from '../components/v7/V7PageHeader';
import V7Panel from '../components/v7/V7Panel';
import V7PanelTitle from '../components/v7/V7PanelTitle';
import Button from '../components/ui/Button';
import { getAuditLogs, type AuditLogRecord } from '../services/auditLogs';
import { getUsers, type UserFilters } from '../services/users';
import type { User } from '../context/AuthContext';

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Создание',
  UPDATE: 'Изменение',
  STATUS_CHANGE: 'Смена статуса',
  DELETE: 'Удаление',
  BLOCK: 'Блокировка',
  UNBLOCK: 'Разблокировка',
  RESET_PASSWORD: 'Сброс пароля',
  USER_BLOCK: 'Блокировка пользователя',
  USER_UNBLOCK: 'Разблокировка пользователя',
  USER_RESET_PASSWORD: 'Сброс пароля',
  REPORT_EXPORT: 'Экспорт отчета',
  REQUEST_STATUS_UPDATE: 'Изменение статуса заявки',
};

const ENTITY_LABELS: Record<string, string> = {
  SHIPYARD: 'Верфь',
  DOCK: 'Док',
  USER: 'Пользователь',
  REPAIR_REQUEST: 'Заявка на ремонт',
  REPAIR: 'Ремонт',
  WORK_ITEM: 'Задача',
  REPORT: 'Отчет',
};

const FIELD_CLASSNAME =
  'h-11 w-full rounded-lg border border-[var(--line-strong)] bg-white px-3 text-[14px] text-[var(--ink)] transition focus:border-[var(--blue)] focus:outline-none focus:ring-2 focus:ring-[rgba(11,101,138,0.16)]';

const SELECT_CLASSNAME = `${FIELD_CLASSNAME} appearance-none pr-9`;

export default function AuditLogs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [actionFilter, setActionFilter] = useState(() => searchParams.get('action') ?? '');
  const [entityTypeFilter, setEntityTypeFilter] = useState(() => searchParams.get('entityType') ?? '');
  const [userIdFilter, setUserIdFilter] = useState<string>(() => searchParams.get('userId') ?? '');
  const [entityIdFilter, setEntityIdFilter] = useState<string>(() => searchParams.get('entityId') ?? '');
  const [fromFilter, setFromFilter] = useState(() => searchParams.get('from') ?? '');
  const [toFilter, setToFilter] = useState(() => searchParams.get('to') ?? '');

  const loadUsers = async () => {
    try {
      const filters: UserFilters = {};
      const usersData = await getUsers(filters);
      setUsers(usersData);
    } catch {
      // keep empty user options
    }
  };

  const loadLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAuditLogs({
        action: actionFilter || undefined,
        entityType: entityTypeFilter || undefined,
        userId: userIdFilter ? Number(userIdFilter) : undefined,
        entityId: entityIdFilter ? Number(entityIdFilter) : undefined,
        from: fromFilter ? new Date(fromFilter).toISOString() : undefined,
        to: toFilter ? new Date(toFilter).toISOString() : undefined,
      });
      setLogs(response);
      if (response.length > 0) {
        setSelectedLog(response[0]);
      } else {
        setSelectedLog(null);
      }
    } catch {
      setError('Не удалось загрузить события аудита.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  useEffect(() => {
    void loadLogs();
  }, []);

  useEffect(() => {
    const next = new URLSearchParams();
    if (actionFilter) next.set('action', actionFilter);
    if (entityTypeFilter) next.set('entityType', entityTypeFilter);
    if (userIdFilter) next.set('userId', userIdFilter);
    if (entityIdFilter) next.set('entityId', entityIdFilter);
    if (fromFilter) next.set('from', fromFilter);
    if (toFilter) next.set('to', toFilter);
    setSearchParams(next, { replace: true });
  }, [actionFilter, entityTypeFilter, userIdFilter, entityIdFilter, fromFilter, toFilter, setSearchParams]);

  const actionOptions = useMemo(() => {
    const values = new Set(logs.map((item) => item.action));
    return Array.from(values).sort((a, b) => a.localeCompare(b, 'ru'));
  }, [logs]);

  const entityTypeOptions = useMemo(() => {
    const values = new Set(logs.map((item) => item.entityType));
    return Array.from(values).sort((a, b) => a.localeCompare(b, 'ru'));
  }, [logs]);

  const exportCsv = () => {
    const escapeCell = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const headers = ['ID', 'Время', 'Действие', 'Сущность', 'ID сущности', 'Пользователь', 'Детали'];
    const rows = logs.map((item) => [
      String(item.id),
      new Date(item.createdAt).toLocaleString('ru-RU'),
      ACTION_LABELS[item.action] ?? item.action,
      item.entityType,
      item.entityId == null ? '' : String(item.entityId),
      item.actorEmail ?? '',
      item.details ?? '',
    ]);

    const csv = [headers, ...rows]
      .map((line) => line.map((cell) => escapeCell(cell)).join(';'))
      .join('\n');

    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <V7PageHeader
        title="Журнал аудита"
        description="События изменений, действий доступа и системных операций."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={exportCsv} disabled={logs.length === 0}>
              Экспорт CSV
            </Button>
            <Button onClick={() => void loadLogs()} disabled={isLoading}>
              Обновить
            </Button>
          </div>
        }
      />

      {error && (
        <div className="px-4 py-3 rounded-lg border bg-[var(--danger-bg)] border-[var(--danger-line)] text-[var(--danger-ink)]">
          {error}
        </div>
      )}

      <V7Panel>
        <V7PanelTitle title="Фильтры" />
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <SelectField value={actionFilter} onChange={setActionFilter}>
            <option value="">Все действия</option>
            {actionOptions.map((action) => (
              <option key={action} value={action}>
                {ACTION_LABELS[action] ?? action}
              </option>
            ))}
          </SelectField>

          <SelectField value={entityTypeFilter} onChange={setEntityTypeFilter}>
            <option value="">Все сущности</option>
            {entityTypeOptions.map((entityType) => (
              <option key={entityType} value={entityType}>
                {ENTITY_LABELS[entityType] ?? entityType}
              </option>
            ))}
          </SelectField>

          <SelectField value={userIdFilter} onChange={setUserIdFilter}>
            <option value="">Любой пользователь</option>
            {users.map((user) => (
              <option key={user.id} value={String(user.id)}>
                {user.fullName}
              </option>
            ))}
          </SelectField>

          <input
            type="number"
            value={entityIdFilter}
            onChange={(e) => setEntityIdFilter(e.target.value)}
            placeholder="ID сущности"
            className={FIELD_CLASSNAME}
          />

          <input
            type="datetime-local"
            value={fromFilter}
            onChange={(e) => setFromFilter(e.target.value)}
            className={FIELD_CLASSNAME}
          />

          <input
            type="datetime-local"
            value={toFilter}
            onChange={(e) => setToFilter(e.target.value)}
            className={FIELD_CLASSNAME}
          />
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Button onClick={() => void loadLogs()} disabled={isLoading}>
            Применить
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setActionFilter('');
              setEntityTypeFilter('');
              setUserIdFilter('');
              setEntityIdFilter('');
              setFromFilter('');
              setToFilter('');
            }}
          >
            Сбросить
          </Button>
        </div>
      </V7Panel>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <V7Panel className="xl:col-span-2">
          <V7PanelTitle title="События" extra={<span className="text-xs text-[var(--muted)]">записей: {logs.length}</span>} />
          {isLoading ? (
            <div className="text-sm text-[var(--muted)]">Загрузка...</div>
          ) : logs.length === 0 ? (
            <div className="text-sm text-[var(--muted)]">События не найдены.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr>
                    <th className="px-3 py-2 border-b border-[var(--line)] text-left text-[11px] font-semibold uppercase text-[var(--muted)]">Время</th>
                    <th className="px-3 py-2 border-b border-[var(--line)] text-left text-[11px] font-semibold uppercase text-[var(--muted)]">Действие</th>
                    <th className="px-3 py-2 border-b border-[var(--line)] text-left text-[11px] font-semibold uppercase text-[var(--muted)]">Сущность</th>
                    <th className="px-3 py-2 border-b border-[var(--line)] text-left text-[11px] font-semibold uppercase text-[var(--muted)]">Кто</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((item) => (
                    <tr
                      key={item.id}
                      className={`cursor-pointer hover:bg-[var(--soft)] ${
                        selectedLog?.id === item.id ? 'bg-[var(--soft)]' : ''
                      }`}
                      onClick={() => setSelectedLog(item)}
                    >
                      <td className="px-3 py-2 border-b border-[var(--line)] text-[var(--muted)]">{new Date(item.createdAt).toLocaleString('ru-RU')}</td>
                      <td className="px-3 py-2 border-b border-[var(--line)] text-[var(--ink)]">{ACTION_LABELS[item.action] ?? item.action}</td>
                      <td className="px-3 py-2 border-b border-[var(--line)] text-[var(--muted)]">
                        {ENTITY_LABELS[item.entityType] ?? item.entityType}
                        {typeof item.entityId === 'number' ? ` #${item.entityId}` : ''}
                      </td>
                      <td className="px-3 py-2 border-b border-[var(--line)] text-[var(--muted)]">{item.actorEmail ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </V7Panel>

        <V7Panel>
          <V7PanelTitle title="Детали события" />
          {!selectedLog ? (
            <div className="text-sm text-[var(--muted)]">Выберите событие в таблице.</div>
          ) : (
            <div className="space-y-3 text-sm">
              <DetailRow label="ID события" value={String(selectedLog.id)} />
              <DetailRow label="Время" value={new Date(selectedLog.createdAt).toLocaleString('ru-RU')} />
              <DetailRow label="Действие" value={ACTION_LABELS[selectedLog.action] ?? selectedLog.action} />
              <DetailRow
                label="Сущность"
                value={`${ENTITY_LABELS[selectedLog.entityType] ?? selectedLog.entityType}${selectedLog.entityId ? ` #${selectedLog.entityId}` : ''}`}
              />
              <DetailRow label="Пользователь" value={selectedLog.actorEmail ?? '-'} />
              <div className="rounded-lg border border-[var(--line)] bg-white px-3 py-2">
                <div className="text-xs text-[var(--muted)] mb-1">Детали</div>
                <div className="text-[var(--ink)] break-words">{selectedLog.details ?? '-'}</div>
              </div>
            </div>
          )}
        </V7Panel>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-white px-3 py-2">
      <div className="text-xs text-[var(--muted)] mb-1">{label}</div>
      <div className="text-[var(--ink)]">{value}</div>
    </div>
  );
}

function SelectField({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className={SELECT_CLASSNAME}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
    </div>
  );
}

