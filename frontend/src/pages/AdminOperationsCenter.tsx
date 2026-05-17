import { useEffect, useMemo, useState } from 'react';
import Button from '../components/ui/Button';
import V7PageHeader from '../components/v7/V7PageHeader';
import V7Panel from '../components/v7/V7Panel';
import V7PanelTitle from '../components/v7/V7PanelTitle';
import { getUsers } from '../services/users';
import { getRepairRequests } from '../services/repairRequests';
import type { User } from '../context/AuthContext';

export default function AdminOperationsCenter() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState(0);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    setWarnings([]);
    const nextWarnings: string[] = [];
    try {
      const [usersResult, requestsResult] = await Promise.allSettled([
        getUsers(),
        getRepairRequests(),
      ]);

      if (usersResult.status === 'fulfilled') {
        setUsers(usersResult.value);
      } else {
        setUsers([]);
        nextWarnings.push('Пользователи');
      }

      if (requestsResult.status === 'fulfilled') {
        setPendingRequests(
          requestsResult.value.filter((item) => item.status === 'SUBMITTED' || item.status === 'UNDER_REVIEW').length
        );
      } else {
        setPendingRequests(0);
        nextWarnings.push('Заявки');
      }

      if (nextWarnings.length === 2) {
        setError('Не удалось загрузить данные операционного центра.');
      } else if (nextWarnings.length > 0) {
        setError('Часть данных временно недоступна.');
      }
      setWarnings(nextWarnings);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const blockedUsers = useMemo(() => users.filter((item) => item.enabled === false), [users]);

  const { noSupervisorCount, noDockCount, invalidHierarchyCount, duplicateEmailGroupsCount } = useMemo(() => {
    const usersById = new Map(users.map((item) => [item.id, item]));
    const expectedSupervisorByRole: Partial<Record<User['role'], User['role']>> = {
      worker: 'master',
      master: 'operator',
      operator: 'dispatcher',
    };

    const emailFrequency = new Map<string, number>();
    users.forEach((item) => {
      const normalizedEmail = item.email.trim().toLowerCase();
      emailFrequency.set(normalizedEmail, (emailFrequency.get(normalizedEmail) ?? 0) + 1);
    });

    let noSupervisor = 0;
    let noDock = 0;
    let invalidHierarchy = 0;

    users.forEach((item) => {
      const expectedSupervisorRole = expectedSupervisorByRole[item.role];
      const supervisor = item.reportsToUserId ? usersById.get(item.reportsToUserId) : undefined;

      if (expectedSupervisorRole && !item.reportsToUserId) {
        noSupervisor += 1;
      }
      if (['worker', 'master', 'operator'].includes(item.role) && !item.dock) {
        noDock += 1;
      }
      if (expectedSupervisorRole && supervisor && supervisor.role !== expectedSupervisorRole) {
        invalidHierarchy += 1;
      }
    });

    const duplicateGroups = Array.from(emailFrequency.values()).filter((count) => count > 1).length;

    return {
      noSupervisorCount: noSupervisor,
      noDockCount: noDock,
      invalidHierarchyCount: invalidHierarchy,
      duplicateEmailGroupsCount: duplicateGroups,
    };
  }, [users]);

  return (
    <div className="space-y-6">
      <V7PageHeader
        title="Операционный центр админа"
        description="Сводка по доступам, структуре и событиям системы."
        actions={
          <Button onClick={() => void load()} disabled={isLoading}>
            Обновить данные
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

      {isLoading && (
        <div className="px-4 py-3 rounded-lg border bg-[var(--soft)] border-[var(--line)] text-[var(--muted)]">
          Загрузка...
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <StatCard label="Пользователи" value={users.length} />
        <StatCard label="Заявки в очереди" value={pendingRequests} />
        <StatCard label="Заблокированные" value={blockedUsers.length} />
        <StatCard label="Ошибки структуры" value={noSupervisorCount + noDockCount + invalidHierarchyCount} />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <V7Panel>
          <V7PanelTitle title="Проблемы данных" />
          <div className="space-y-3">
            <IssueRow
              title="Без руководителя"
              count={noSupervisorCount}
              hint="Рабочие, мастера и операторы должны быть в цепочке подчинения."
            />
            <IssueRow title="Без дока" count={noDockCount} hint="Оператор, мастер и рабочий должны быть привязаны к доку." />
            <IssueRow
              title="Нарушенная орг-цепочка"
              count={invalidHierarchyCount}
              hint="Роль руководителя не соответствует модели worker->master->operator->dispatcher."
            />
            <IssueRow title="Дубли email" count={duplicateEmailGroupsCount} hint="Дублирующиеся email усложняют поддержку и аудит." />
          </div>
        </V7Panel>
      </div>

    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[8px] border border-[var(--line)] bg-[rgba(255,255,255,0.97)] px-3 py-3">
      <span className="block text-xs text-[var(--muted)]">{label}</span>
      <strong className="mt-1 block text-xl leading-tight text-[var(--ink)]">{value}</strong>
    </div>
  );
}

function IssueRow({ title, count, hint }: { title: string; count: number; hint: string }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-white px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <div className="font-medium text-[var(--ink)]">{title}</div>
        <div className="text-sm font-semibold text-[var(--ink)]">{count}</div>
      </div>
      <div className="text-xs text-[var(--muted)] mt-1">{hint}</div>
    </div>
  );
}
