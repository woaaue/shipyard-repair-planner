import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users as UsersIcon, Plus, Search, MoreVertical } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { mockUsers, addUser } from '../mock-data/mockUsers';
import { useAuth } from '../context/AuthContext';
import UserForm from '../components/forms/UserForm';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Администратор',
  dispatcher: 'Диспетчер',
  operator: 'Оператор дока',
  master: 'Мастер участка',
  worker: 'Рабочий',
  client: 'Владелец судна'
};

export default function Users() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserForm, setShowUserForm] = useState(false);

  const filteredUsers = mockUsers.filter((u) => {
    const user = u as { dock?: string; shipId?: number };
    if (currentUser?.role === 'operator' && user.dock && currentUser.dock) {
      return user.dock === currentUser.dock;
    }
    if (searchQuery) {
      return u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const handleAddUser = (userData: any) => {
    addUser({
      email: userData.email,
      password: '123456',
      role: userData.role,
      fullName: userData.fullName,
      dock: userData.dock,
      shipId: userData.shipId ? parseInt(userData.shipId) : undefined,
      avatar: '👤'
    });
    setShowUserForm(false);
  };

  const handleEditUser = (email: string) => {
    navigate(`/users/${encodeURIComponent(email)}`);
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

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">ФИО</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Роль</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Док/Судно</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Статус</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-lg">
                        {user.avatar}
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
                  <td className="px-4 py-3 text-gray-600">
                    {(user as { dock?: string; shipId?: number }).dock || ((user as { shipId?: number }).shipId ? `Судно #${(user as { shipId?: number }).shipId}` : '-')}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                      Активен
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button 
                      className="p-1 text-gray-400 hover:text-gray-600"
                      onClick={() => handleEditUser(user.email)}
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Пользователи не найдены
          </div>
        )}
      </Card>

      {showUserForm && (
        <UserForm 
          onClose={() => setShowUserForm(false)}
          onSubmit={handleAddUser}
        />
      )}
    </div>
  );
}