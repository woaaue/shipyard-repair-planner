import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import V7PageHeader from '../components/v7/V7PageHeader';
import V7Panel from '../components/v7/V7Panel';
import V7PanelTitle from '../components/v7/V7PanelTitle';
import Button from '../components/ui/Button';
import { getUsers } from '../services/users';
import type { User } from '../context/AuthContext';

type Incident = {
  key: string;
  title: string;
  severity: 'high' | 'medium' | 'low';
  count: number;
  description: string;
  actionLabel: string;
  actionPath: string;
};

export default function AdminIncidents() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const [users, setUsers] = useState<User[]>([]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    setWarnings([]);
    const nextWarnings: string[] = [];
    try {
      const [usersResult] = await Promise.allSettled([getUsers()]);

      if (usersResult.status === 'fulfilled') {
        setUsers(usersResult.value);
      } else {
        setUsers([]);
        nextWarnings.push('Пользователи');
      }

      if (nextWarnings.length === 1) {
        setError('Не удалось загрузить центр инцидентов.');
      } else if (nextWarnings.length > 0) {
        setError('Часть данных временно недоступна.');
      }
      setWarnings(nextWarnings);
    } catch {
      setError('Не удалось загрузить центр инцидентов.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const blockedUsersCount = useMemo(() => users.filter((item) => item.enabled === false).length, [users]);

  const { withoutSupervisorCount, withoutDockCount, invalidHierarchyCount } = useMemo(() => {
    const expectedSupervisorByRole: Partial<Record<User['role'], User['role']>> = {
      worker: 'master',
      master: 'operator',
      operator: 'dispatcher',
    };
    const usersById = new Map(users.map((u) => [u.id, u]));

    let noSupervisor = 0;
    let noDock = 0;
    let invalidHierarchy = 0;

    users.forEach((item) => {
      const expected = expectedSupervisorByRole[item.role];
      if (expected && !item.reportsToUserId) {
        noSupervisor += 1;
      }
      if (['worker', 'master', 'operator'].includes(item.role) && !item.dock) {
        noDock += 1;
      }
      if (expected && item.reportsToUserId) {
        const supervisor = usersById.get(item.reportsToUserId);
        if (!supervisor || supervisor.role !== expected) {
          invalidHierarchy += 1;
        }
      }
    });

    return {
      withoutSupervisorCount: noSupervisor,
      withoutDockCount: noDock,
      invalidHierarchyCount: invalidHierarchy,
    };
  }, [users]);

  const incidents = useMemo<Incident[]>(() => {

    const list: Incident[] = [
      {
        key: 'blocked-users',
        title: 'Заблокированные пользователи',
        severity: 'medium',
        count: blockedUsersCount,
        description: 'Проверьте блокировки и восстановите доступ, если это не инцидент безопасности.',
        actionLabel: 'Открыть пользователей',
        actionPath: '/users',
      },
      {
        key: 'hierarchy',
        title: 'Нарушения орг-структуры',
        severity: 'high',
        count: invalidHierarchyCount + withoutSupervisorCount,
        description: 'Проблемы подчиненности влияют на назначение задач и контроль исполнения.',
        actionLabel: 'Открыть пользователей',
        actionPath: '/users',
      },
      {
        key: 'dock-assignments',
        title: 'Неполные привязки к докам',
        severity: 'medium',
        count: withoutDockCount,
        description: 'Оператор, мастер и рабочий должны иметь корректную привязку к доку.',
        actionLabel: 'Открыть пользователей',
        actionPath: '/users',
      },
    ];

    return list.filter((item) => item.count > 0).sort((a, b) => b.count - a.count);
  }, [blockedUsersCount, invalidHierarchyCount, withoutDockCount, withoutSupervisorCount]);

  return (
    <div className="space-y-6">
      <V7PageHeader
        title="Центр инцидентов"
        description="Оперативный разбор проблем доступа, орг-структуры и рисковых действий."
        actions={
          <Button onClick={() => void loadData()} disabled={isLoading}>
            Обновить
          </Button>
        }
      />

      {error && (
        <div className="px-4 py-3 rounded-lg border bg-[var(--danger-bg)] border-[var(--danger-line)] text-[var(--danger-ink)]">
          {error}
        </div>
      )}
      {warnings.length > 0 && (
        <div className="px-4 py-3 rounded-lg border bg-[var(--soft)] border-[var(--line)] text-[var(--ink)]">
          Недоступные блоки: {warnings.join(', ')}.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <StatCard label="Активные инциденты" value={incidents.length} />
        <StatCard label="Заблокированные" value={blockedUsersCount} />
        <StatCard label="Нарушения иерархии" value={invalidHierarchyCount} />
        <StatCard
          label="Проблемы качества"
          value={withoutSupervisorCount + withoutDockCount + invalidHierarchyCount}
        />
      </div>

      <V7Panel>
        <V7PanelTitle title="Активные инциденты" extra={<span className="text-xs text-[var(--muted)]">элементов: {incidents.length}</span>} />
        {isLoading ? (
          <div className="text-sm text-[var(--muted)]">Загрузка...</div>
        ) : incidents.length === 0 ? (
          <div className="text-sm text-[var(--muted)]">Сейчас активных инцидентов нет.</div>
        ) : (
          <div className="space-y-3">
            {incidents.map((incident) => (
              <div key={incident.key} className="rounded-lg border border-[var(--line)] bg-white px-4 py-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-semibold text-[var(--ink)]">{incident.title}</div>
                  <div className="text-xs text-[var(--muted)] mt-1">{incident.description}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${severityClass(incident.severity)}`}>
                    {severityLabel(incident.severity)}
                  </span>
                  <span className="text-lg font-bold text-[var(--ink)]">{incident.count}</span>
                  <Button size="sm" variant="secondary" onClick={() => navigate(incident.actionPath)}>
                    {incident.actionLabel}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </V7Panel>

    </div>
  );
}

function severityClass(severity: Incident['severity']): string {
  if (severity === 'high') return 'bg-red-100 text-red-700';
  if (severity === 'medium') return 'bg-amber-100 text-amber-700';
  return 'bg-slate-100 text-slate-700';
}

function severityLabel(severity: Incident['severity']): string {
  if (severity === 'high') return 'Высокий';
  if (severity === 'medium') return 'Средний';
  return 'Низкий';
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[8px] border border-[var(--line)] bg-[rgba(255,255,255,0.97)] px-3 py-3">
      <span className="block text-xs text-[var(--muted)]">{label}</span>
      <strong className="mt-1 block text-xl leading-tight text-[var(--ink)]">{value}</strong>
    </div>
  );
}
