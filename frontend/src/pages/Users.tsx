import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, MoreVertical } from 'lucide-react';
import Button from '../components/ui/Button';
import { useAuth, type User as AuthUser } from '../context/AuthContext';
import UserForm from '../components/forms/UserForm';
import {
  createUser,
  getSubordinates,
  getUsers,
  type UserFilters,
} from '../services/users';
import { getDocks } from '../services/docks';
import V7PageHeader from '../components/v7/V7PageHeader';
import V7Panel from '../components/v7/V7Panel';
import V7PanelTitle from '../components/v7/V7PanelTitle';
import V7StateText from '../components/v7/V7StateText';
import { ROLE_UI_LABELS } from '../constants/labels';

const ROLE_LABELS: Record<string, string> = ROLE_UI_LABELS;

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
}

export default function Users() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState<AuthUser[]>([]);
  const [docks, setDocks] = useState<{ id: number; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [hierarchyFilter, setHierarchyFilter] = useState<'all' | 'without_supervisor'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | AuthUser['role']>('all');
  const [dockFilter, setDockFilter] = useState<'all' | string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [quickIssueFilter, setQuickIssueFilter] = useState<'all' | 'no_supervisor' | 'no_dock' | 'disabled'>('all');
  const [showUserForm, setShowUserForm] = useState(false);
  const canCreateUser =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'dispatcher' ||
    currentUser?.role === 'operator' ||
    currentUser?.role === 'master';

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filters: UserFilters = searchQuery ? { search: searchQuery } : {};
      const [usersData, docksData] = await Promise.all([getUsers(filters), getDocks()]);
      let scopedUsers = usersData;

      if (currentUser?.role === 'dispatcher' || currentUser?.role === 'operator' || currentUser?.role === 'master') {
        if (typeof currentUser.id === 'number') {
          const subordinates = await getSubordinates(currentUser.id);
          const allowedIds = new Set<number>([currentUser.id, ...subordinates.map((u) => u.id)]);
          scopedUsers = usersData.filter((u) => allowedIds.has(u.id));
        }
      } else if (currentUser?.role === 'worker' || currentUser?.role === 'client') {
        if (typeof currentUser.id === 'number') {
          scopedUsers = usersData.filter((u) => u.id === currentUser.id);
        }
      }

      setUsers(scopedUsers);
      setDocks(docksData.map((dock) => ({ id: dock.id, name: dock.name })));
    } catch {
      setError('Не удалось загрузить пользователей');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (dockFilter !== 'all' && (u.dock || '-') !== dockFilter) return false;
      if (statusFilter === 'enabled' && u.enabled === false) return false;
      if (statusFilter === 'disabled' && u.enabled !== false) return false;
      if (quickIssueFilter === 'disabled' && u.enabled !== false) return false;
      if (quickIssueFilter === 'no_supervisor') {
        const requiresSupervisor = ['worker', 'master', 'operator'].includes(u.role);
        if (!(requiresSupervisor && !u.reportsToUserId)) return false;
      }
      if (quickIssueFilter === 'no_dock') {
        const requiresDock = ['worker', 'master', 'operator'].includes(u.role);
        if (!(requiresDock && !u.dock)) return false;
      }
      if (currentUser?.role === 'operator' && currentUser.dock && u.dock) {
        if (u.dock !== currentUser.dock) return false;
      }
      if (hierarchyFilter === 'without_supervisor') {
        const requiresSupervisor = ['worker', 'master', 'operator'].includes(u.role);
        if (!(requiresSupervisor && !u.reportsToUserId)) return false;
      }
      if (!q) return true;
      const matchesSearch = u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      if (!matchesSearch) return false;
      return true;
    });
  }, [users, currentUser, hierarchyFilter, searchQuery, roleFilter, dockFilter, statusFilter, quickIssueFilter]);

  const problemCounters = useMemo(() => {
    const noSupervisor = users.filter((u) => ['worker', 'master', 'operator'].includes(u.role) && !u.reportsToUserId).length;
    const noDock = users.filter((u) => ['worker', 'master', 'operator'].includes(u.role) && !u.dock).length;
    const disabled = users.filter((u) => u.enabled === false).length;
    return { noSupervisor, noDock, disabled };
  }, [users]);

  const dockOptions = useMemo(() => {
    const items = new Set<string>();
    users.forEach((u) => items.add(u.dock || '-'));
    return Array.from(items).sort((a, b) => a.localeCompare(b, 'ru'));
  }, [users]);

  const handleAddUser = async (formData: {
    fullName: string;
    email: string;
    password: string;
    role: AuthUser['role'];
    dock?: string;
    reportsToUserId?: number;
  }) => {
    const dockId = formData.dock
      ? docks.find((dock) => dock.name === formData.dock)?.id
      : undefined;

    setError(null);
    try {
      await createUser({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        role: formData.role,
        dock: formData.dock,
        dockId,
        reportsToUserId: formData.reportsToUserId,
      });

      setShowUserForm(false);
      await loadData();
    } catch {
      setError('Не удалось создать пользователя');
    }
  };

  const handleEditUser = (id: number) => {
    navigate(`/users/${id}`);
  };

  return (
    <div className="space-y-6">
      <V7PageHeader
        title="Пользователи и подчиненность"
        description="Управление ролями, подчиненностью и структурой команды."
        actions={
          canCreateUser ? (
            <Button onClick={() => setShowUserForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Создать пользователя
            </Button>
          ) : null
        }
      />

      {error && (
        <div className="px-4 py-3 rounded-lg border bg-[var(--danger-bg)] border-[var(--danger-line)] text-[var(--danger-ink)]">{error}</div>
      )}

      <V7Panel>
        <V7PanelTitle title="Контроль структуры и качества" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setQuickIssueFilter('no_supervisor')}
            className="text-left rounded-lg border border-[var(--line)] bg-white px-3 py-3 hover:bg-[var(--soft)]"
          >
            <div className="text-xs text-[var(--muted)]">Без руководителя</div>
            <div className="text-xl font-semibold text-[var(--ink)]">{problemCounters.noSupervisor}</div>
          </button>
          <button
            type="button"
            onClick={() => setQuickIssueFilter('no_dock')}
            className="text-left rounded-lg border border-[var(--line)] bg-white px-3 py-3 hover:bg-[var(--soft)]"
          >
            <div className="text-xs text-[var(--muted)]">Без дока</div>
            <div className="text-xl font-semibold text-[var(--ink)]">{problemCounters.noDock}</div>
          </button>
          <button
            type="button"
            onClick={() => setQuickIssueFilter('disabled')}
            className="text-left rounded-lg border border-[var(--line)] bg-white px-3 py-3 hover:bg-[var(--soft)]"
          >
            <div className="text-xs text-[var(--muted)]">Заблокированные</div>
            <div className="text-xl font-semibold text-[var(--ink)]">{problemCounters.disabled}</div>
          </button>
        </div>
      </V7Panel>

      <V7Panel>
        <V7PanelTitle
          title="Пользователи"
         
          extra={<span className="text-xs font-extrabold text-[var(--muted)]">записей: {filteredUsers.length}</span>}
        />
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <button
            className={`px-3 py-1.5 text-xs rounded-lg border ${quickIssueFilter === 'all' ? 'border-[var(--line-strong)] bg-[var(--soft)] text-[var(--ink)]' : 'border-[var(--line)] text-[var(--muted)]'}`}
            onClick={() => setQuickIssueFilter('all')}
          >
            Все
          </button>
          <button
            className={`px-3 py-1.5 text-xs rounded-lg border ${quickIssueFilter === 'no_supervisor' ? 'border-[var(--line-strong)] bg-[var(--soft)] text-[var(--ink)]' : 'border-[var(--line)] text-[var(--muted)]'}`}
            onClick={() => setQuickIssueFilter('no_supervisor')}
          >
            Без руководителя ({problemCounters.noSupervisor})
          </button>
          <button
            className={`px-3 py-1.5 text-xs rounded-lg border ${quickIssueFilter === 'no_dock' ? 'border-[var(--line-strong)] bg-[var(--soft)] text-[var(--ink)]' : 'border-[var(--line)] text-[var(--muted)]'}`}
            onClick={() => setQuickIssueFilter('no_dock')}
          >
            Без дока ({problemCounters.noDock})
          </button>
          <button
            className={`px-3 py-1.5 text-xs rounded-lg border ${quickIssueFilter === 'disabled' ? 'border-[var(--line-strong)] bg-[var(--soft)] text-[var(--ink)]' : 'border-[var(--line)] text-[var(--muted)]'}`}
            onClick={() => setQuickIssueFilter('disabled')}
          >
            Заблокированные ({problemCounters.disabled})
          </button>
        </div>
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--muted)] h-5 w-5" />
            <input
              type="text"
              placeholder="Поиск по имени или email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
            />
          </div>
          <select
            value={hierarchyFilter}
            onChange={(e) => setHierarchyFilter(e.target.value as 'all' | 'without_supervisor')}
            className="px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
          >
            <option value="all">Все пользователи</option>
            <option value="without_supervisor">Без руководителя</option>
          </select>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'all' | AuthUser['role'])}
            className="px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
          >
            <option value="all">Все роли</option>
            <option value="admin">Администратор</option>
            <option value="dispatcher">Диспетчер</option>
            <option value="operator">Оператор дока</option>
            <option value="master">Мастер участка</option>
            <option value="worker">Рабочий</option>
            <option value="client">Клиент</option>
          </select>
          <select
            value={dockFilter}
            onChange={(e) => setDockFilter(e.target.value as 'all' | string)}
            className="px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
          >
            <option value="all">Все доки</option>
            {dockOptions.map((dockName) => (
              <option key={dockName} value={dockName}>
                {dockName}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'enabled' | 'disabled')}
            className="px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
          >
            <option value="all">Любой статус</option>
            <option value="enabled">Активен</option>
            <option value="disabled">Отключен</option>
          </select>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-[var(--muted)]">Загрузка...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className="px-3 py-2 border-b border-[var(--line)] text-left text-[11px] font-semibold uppercase text-[var(--muted)]">ФИО</th>
                  <th className="px-3 py-2 border-b border-[var(--line)] text-left text-[11px] font-semibold uppercase text-[var(--muted)]">Email</th>
                  <th className="px-3 py-2 border-b border-[var(--line)] text-left text-[11px] font-semibold uppercase text-[var(--muted)]">Роль</th>
                  <th className="px-3 py-2 border-b border-[var(--line)] text-left text-[11px] font-semibold uppercase text-[var(--muted)]">Док</th>
                  <th className="px-3 py-2 border-b border-[var(--line)] text-left text-[11px] font-semibold uppercase text-[var(--muted)]">Руководитель</th>
                  <th className="px-3 py-2 border-b border-[var(--line)] text-left text-[11px] font-semibold uppercase text-[var(--muted)]">Статус</th>
                  <th className="px-3 py-2 border-b border-[var(--line)] text-right text-[11px] font-semibold uppercase text-[var(--muted)]">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-[var(--soft)]">
                    <td className="px-3 py-2 border-b border-[var(--line)]">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-[var(--soft)] border border-[var(--line)] flex items-center justify-center text-sm font-semibold text-[var(--ink)]">
                          {getInitials(user.fullName)}
                        </div>
                        <span className="font-medium">{user.fullName}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 border-b border-[var(--line)] text-[var(--muted)]">{user.email}</td>
                    <td className="px-3 py-2 border-b border-[var(--line)] text-[var(--ink)]">{ROLE_LABELS[user.role] || user.role}</td>
                    <td className="px-3 py-2 border-b border-[var(--line)] text-[var(--muted)]">{user.dock || '-'}</td>
                    <td className="px-3 py-2 border-b border-[var(--line)] text-[var(--muted)]">
                      {user.role === 'dispatcher' ? '-' : (user.reportsToFullName || '-')}
                    </td>
                    <td className="px-3 py-2 border-b border-[var(--line)]">
                      <V7StateText value={user.enabled === false ? 'DISABLED' : 'ENABLED'} />
                    </td>
                    <td className="px-3 py-2 border-b border-[var(--line)] text-right">
                      <div className="flex items-center justify-end">
                        <Button size="sm" variant="secondary" onClick={() => handleEditUser(user.id)}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && filteredUsers.length === 0 && (
          <div className="text-center py-8 text-[var(--muted)]">Пользователи не найдены</div>
        )}
      </V7Panel>

      {showUserForm && (
        <UserForm
          onClose={() => setShowUserForm(false)}
          onSubmit={handleAddUser}
          docks={docks.map((dock) => dock.name)}
          users={users}
        />
      )}
    </div>
  );
}

