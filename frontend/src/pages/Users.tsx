import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users as UsersIcon, Plus, Search, MoreVertical } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuth, type User as AuthUser } from '../context/AuthContext';
import UserForm from '../components/forms/UserForm';
import { createUser, getUsers, type UserFilters } from '../services/users';
import { getDocks } from '../services/docks';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Администратор',
  dispatcher: 'Диспетчер',
  operator: 'Оператор дока',
  master: 'Мастер участка',
  worker: 'Рабочий',
  client: 'Владелец судна',
};

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
  const [showUserForm, setShowUserForm] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filters: UserFilters = searchQuery ? { search: searchQuery } : {};
      const [usersData, docksData] = await Promise.all([getUsers(filters), getDocks()]);
      setUsers(usersData);
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
      if (currentUser?.role === 'operator' && currentUser.dock && u.dock) {
        if (u.dock !== currentUser.dock) return false;
      }
      if (!q) return true;
      return u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    });
  }, [users, currentUser, searchQuery]);

  const handleAddUser = async (formData: {
    fullName: string;
    email: string;
    password: string;
    role: AuthUser['role'];
    dock?: string;
  }) => {
    const dockId = formData.dock
      ? docks.find((dock) => dock.name === formData.dock)?.id
      : undefined;

    await createUser({
      email: formData.email,
      password: formData.password,
      fullName: formData.fullName,
      role: formData.role,
      dock: formData.dock,
      dockId,
    });

    setShowUserForm(false);
    await loadData();
  };

  const handleEditUser = (id: number) => {
    navigate(`/users/${id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UsersIcon className="h-8 w-8 text-gray-600" />
          <h1 className="text-2xl font-bold text-gray-900">Пользователи</h1>
        </div>
        <Button onClick={() => setShowUserForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Добавить пользователя
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}

      <Card>
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Поиск по имени или email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Загрузка...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">ФИО</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Роль</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Док</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Статус</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-700">
                          {getInitials(user.fullName)}
                        </div>
                        <span className="font-medium">{user.fullName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{user.dock || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Активен</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="p-1 text-gray-400 hover:text-gray-600"
                        onClick={() => handleEditUser(user.id)}
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && filteredUsers.length === 0 && (
          <div className="text-center py-8 text-gray-500">Пользователи не найдены</div>
        )}
      </Card>

      {showUserForm && (
        <UserForm
          onClose={() => setShowUserForm(false)}
          onSubmit={handleAddUser}
          docks={docks.map((dock) => dock.name)}
        />
      )}
    </div>
  );
}
