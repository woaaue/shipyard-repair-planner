import { useEffect, useMemo, useState } from 'react';
import V7PageHeader from '../components/v7/V7PageHeader';
import V7Panel from '../components/v7/V7Panel';
import V7PanelTitle from '../components/v7/V7PanelTitle';
import Button from '../components/ui/Button';
import { getDocks, type Dock } from '../services/docks';
import { getUsers, updateUser } from '../services/users';
import type { User } from '../context/AuthContext';
import { ROLE_UI_LABELS } from '../constants/labels';

const ROLE_LABELS: Record<User['role'], string> = ROLE_UI_LABELS;

const SUPERVISOR_ROLE_BY_USER_ROLE: Partial<Record<User['role'], User['role']>> = {
  worker: 'master',
  master: 'operator',
  operator: 'dispatcher',
};

const ROLES_WITH_DOCK: User['role'][] = ['worker', 'master', 'operator'];

export default function OrganizationHierarchy() {
  const [users, setUsers] = useState<User[]>([]);
  const [docks, setDocks] = useState<Dock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | User['role']>('all');
  const [issueFilter, setIssueFilter] = useState<'all' | 'no_supervisor' | 'no_dock' | 'invalid_supervisor'>('all');

  const [draftSupervisorByUserId, setDraftSupervisorByUserId] = useState<Record<number, string>>({});
  const [draftDockByUserId, setDraftDockByUserId] = useState<Record<number, string>>({});

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [usersData, docksData] = await Promise.all([getUsers(), getDocks()]);
      setUsers(usersData);
      setDocks(docksData);
      setDraftSupervisorByUserId(
        Object.fromEntries(usersData.map((user) => [user.id, user.reportsToUserId ? String(user.reportsToUserId) : '']))
      );
      setDraftDockByUserId(
        Object.fromEntries(
          usersData.map((user) => {
            const dock = docksData.find((item) => item.name === user.dock);
            return [user.id, dock ? String(dock.id) : ''];
          })
        )
      );
    } catch {
      setError('Не удалось загрузить орг-структуру.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const usersById = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);

  const expectedSupervisorRole = (role: User['role']): User['role'] | null => {
    return SUPERVISOR_ROLE_BY_USER_ROLE[role] ?? null;
  };

  const roleStats = useMemo(() => {
    const stats: Record<User['role'], number> = {
      admin: 0,
      dispatcher: 0,
      operator: 0,
      master: 0,
      worker: 0,
      client: 0,
    };
    users.forEach((user) => {
      stats[user.role] += 1;
    });
    return stats;
  }, [users]);

  const counters = useMemo(() => {
    let noSupervisor = 0;
    let noDock = 0;
    let invalidSupervisor = 0;

    users.forEach((user) => {
      const expected = expectedSupervisorRole(user.role);
      const supervisor = user.reportsToUserId ? usersById.get(user.reportsToUserId) : undefined;
      if (expected && !user.reportsToUserId) noSupervisor += 1;
      if (ROLES_WITH_DOCK.includes(user.role) && !user.dock) noDock += 1;
      if (expected && supervisor && supervisor.role !== expected) invalidSupervisor += 1;
    });

    return { noSupervisor, noDock, invalidSupervisor };
  }, [users, usersById]);

  const filteredUsers = useMemo(() => {
    const query = search.toLowerCase().trim();
    return users.filter((user) => {
      if (roleFilter !== 'all' && user.role !== roleFilter) return false;

      const expected = expectedSupervisorRole(user.role);
      const supervisor = user.reportsToUserId ? usersById.get(user.reportsToUserId) : undefined;

      if (issueFilter === 'no_supervisor' && !(expected && !user.reportsToUserId)) return false;
      if (issueFilter === 'no_dock' && !(ROLES_WITH_DOCK.includes(user.role) && !user.dock)) return false;
      if (issueFilter === 'invalid_supervisor' && !(expected && supervisor && supervisor.role !== expected)) return false;

      if (!query) return true;
      return user.fullName.toLowerCase().includes(query) || user.email.toLowerCase().includes(query);
    });
  }, [users, usersById, search, roleFilter, issueFilter]);

  const supervisorCandidates = (user: User): User[] => {
    const expected = expectedSupervisorRole(user.role);
    if (!expected) return [];
    return users.filter((candidate) => candidate.role === expected);
  };

  const handleSaveRow = async (user: User) => {
    setError(null);
    setNotice(null);
    setIsSaving(user.id);
    try {
      const selectedSupervisor = draftSupervisorByUserId[user.id];
      const selectedDock = draftDockByUserId[user.id];

      const dockId = selectedDock ? Number(selectedDock) : undefined;
      const reportsToUserId = selectedSupervisor ? Number(selectedSupervisor) : undefined;

      await updateUser(user.id, {
        ...user,
        dockId,
        reportsToUserId,
      });

      setNotice(`Изменения сохранены: ${user.fullName}`);
      await loadData();
    } catch {
      setError('Не удалось сохранить изменения. Проверьте корректность иерархии и привязок.');
    } finally {
      setIsSaving(null);
    }
  };

  return (
    <div className="space-y-6">
      <V7PageHeader
        title="Орг-структура"
        description="Быстрые назначения руководителей и доков для ролей worker/master/operator."
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
      {notice && (
        <div className="px-4 py-3 rounded-lg border bg-[var(--soft)] border-[var(--line)] text-[var(--ink)]">
          {notice}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <StatCard label="Диспетчеры" value={roleStats.dispatcher} />
        <StatCard label="Операторы" value={roleStats.operator} />
        <StatCard label="Мастера" value={roleStats.master} />
        <StatCard label="Рабочие" value={roleStats.worker} />
      </div>

      <V7Panel>
        <V7PanelTitle
          title="Контроль структуры"
          extra={<span className="text-xs font-extrabold text-[var(--muted)]">всего: {filteredUsers.length}</span>}
        />

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button
            className={`px-3 py-1.5 text-xs rounded-lg border ${issueFilter === 'all' ? 'border-[var(--line-strong)] bg-[var(--soft)] text-[var(--ink)]' : 'border-[var(--line)] text-[var(--muted)]'}`}
            onClick={() => setIssueFilter('all')}
          >
            Все
          </button>
          <button
            className={`px-3 py-1.5 text-xs rounded-lg border ${issueFilter === 'no_supervisor' ? 'border-[var(--line-strong)] bg-[var(--soft)] text-[var(--ink)]' : 'border-[var(--line)] text-[var(--muted)]'}`}
            onClick={() => setIssueFilter('no_supervisor')}
          >
            Без руководителя ({counters.noSupervisor})
          </button>
          <button
            className={`px-3 py-1.5 text-xs rounded-lg border ${issueFilter === 'no_dock' ? 'border-[var(--line-strong)] bg-[var(--soft)] text-[var(--ink)]' : 'border-[var(--line)] text-[var(--muted)]'}`}
            onClick={() => setIssueFilter('no_dock')}
          >
            Без дока ({counters.noDock})
          </button>
          <button
            className={`px-3 py-1.5 text-xs rounded-lg border ${issueFilter === 'invalid_supervisor' ? 'border-[var(--line-strong)] bg-[var(--soft)] text-[var(--ink)]' : 'border-[var(--line)] text-[var(--muted)]'}`}
            onClick={() => setIssueFilter('invalid_supervisor')}
          >
            Неверный руководитель ({counters.invalidSupervisor})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-5">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по ФИО или email..."
            className="min-w-[260px] flex-1 px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)]"
          />
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value as 'all' | User['role'])}
            className="px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)]"
          >
            <option value="all">Все роли</option>
            <option value="dispatcher">Диспетчер</option>
            <option value="operator">Оператор дока</option>
            <option value="master">Мастер участка</option>
            <option value="worker">Рабочий</option>
            <option value="client">Клиент</option>
            <option value="admin">Администратор</option>
          </select>
        </div>

        {isLoading ? (
          <div className="text-sm text-[var(--muted)]">Загрузка...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className="px-3 py-2 border-b border-[var(--line)] text-left text-[11px] font-semibold uppercase text-[var(--muted)]">Пользователь</th>
                  <th className="px-3 py-2 border-b border-[var(--line)] text-left text-[11px] font-semibold uppercase text-[var(--muted)]">Роль</th>
                  <th className="px-3 py-2 border-b border-[var(--line)] text-left text-[11px] font-semibold uppercase text-[var(--muted)]">Текущий руководитель</th>
                  <th className="px-3 py-2 border-b border-[var(--line)] text-left text-[11px] font-semibold uppercase text-[var(--muted)]">Назначить руководителя</th>
                  <th className="px-3 py-2 border-b border-[var(--line)] text-left text-[11px] font-semibold uppercase text-[var(--muted)]">Док</th>
                  <th className="px-3 py-2 border-b border-[var(--line)] text-right text-[11px] font-semibold uppercase text-[var(--muted)]">Сохранить</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const expected = expectedSupervisorRole(user.role);
                  const currentSupervisor = user.reportsToUserId ? usersById.get(user.reportsToUserId) : undefined;
                  const candidates = supervisorCandidates(user);
                  const requiresDock = ROLES_WITH_DOCK.includes(user.role);

                  return (
                    <tr key={user.id} className="hover:bg-[var(--soft)]">
                      <td className="px-3 py-2 border-b border-[var(--line)]">
                        <div className="font-medium text-[var(--ink)]">{user.fullName}</div>
                        <div className="text-xs text-[var(--muted)]">{user.email}</div>
                      </td>
                      <td className="px-3 py-2 border-b border-[var(--line)] text-[var(--muted)]">{ROLE_LABELS[user.role]}</td>
                      <td className="px-3 py-2 border-b border-[var(--line)] text-[var(--muted)]">
                        {expected ? (
                          currentSupervisor ? (
                            <>
                              {currentSupervisor.fullName}
                              {currentSupervisor.role !== expected ? ' (несоответствие роли)' : ''}
                            </>
                          ) : (
                            'Не назначен'
                          )
                        ) : (
                          'Не требуется'
                        )}
                      </td>
                      <td className="px-3 py-2 border-b border-[var(--line)]">
                        {expected ? (
                          <select
                            value={draftSupervisorByUserId[user.id] ?? ''}
                            onChange={(event) =>
                              setDraftSupervisorByUserId((prev) => ({ ...prev, [user.id]: event.target.value }))
                            }
                            className="w-full px-2 py-1.5 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)]"
                          >
                            <option value="">Не назначать</option>
                            {candidates.map((candidate) => (
                              <option key={candidate.id} value={candidate.id}>
                                {candidate.fullName}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs text-[var(--muted)]">Не требуется</span>
                        )}
                      </td>
                      <td className="px-3 py-2 border-b border-[var(--line)]">
                        {requiresDock ? (
                          <select
                            value={draftDockByUserId[user.id] ?? ''}
                            onChange={(event) =>
                              setDraftDockByUserId((prev) => ({ ...prev, [user.id]: event.target.value }))
                            }
                            className="w-full px-2 py-1.5 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)]"
                          >
                            <option value="">Не назначать</option>
                            {docks.map((dock) => (
                              <option key={dock.id} value={dock.id}>
                                {dock.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs text-[var(--muted)]">Не требуется</span>
                        )}
                      </td>
                      <td className="px-3 py-2 border-b border-[var(--line)] text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={isSaving === user.id}
                          onClick={() => void handleSaveRow(user)}
                        >
                          Сохранить
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </V7Panel>
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
