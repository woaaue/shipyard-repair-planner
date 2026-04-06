import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Shield, MapPin, Calendar, UserX, RefreshCw } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { mockUsers } from '../mock-data/mockUsers';
import { useAuth } from '../context/AuthContext';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Администратор',
  dispatcher: 'Диспетчер',
  operator: 'Оператор дока',
  master: 'Мастер участка',
  worker: 'Рабочий',
  client: 'Владелец судна'
};

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [isBlocked, setIsBlocked] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [editData, setEditData] = useState({
    fullName: '',
    role: '',
    dock: ''
  });
  
  const userEmail = decodeURIComponent(id || '');
  const user = mockUsers.find(u => u.email === userEmail);
  
  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Пользователь не найден</h2>
        <Button onClick={() => navigate('/users')} className="mt-4">
          Вернуться к списку
        </Button>
      </div>
    );
  }
  
  const userData = user as { dock?: string; shipId?: number; blocked?: boolean };
  const canEdit = currentUser?.role === 'admin';
  
  const handleBlockUser = () => {
    setIsBlocked(true);
    setShowBlockModal(false);
  };
  
  const handleResetPassword = () => {
    const generated = 'Temp' + Math.random().toString(36).slice(2, 8).toUpperCase();
    setTempPassword(generated);
    setShowResetModal(true);
  };
  
  const handleEditClick = () => {
    setEditData({
      fullName: user.fullName,
      role: user.role,
      dock: userData.dock || ''
    });
    setShowEditModal(true);
  };
  
  const handleSaveEdit = () => {
    user.fullName = editData.fullName;
    (user as any).role = editData.role;
    if (['operator', 'master', 'worker'].includes(editData.role)) {
      (user as any).dock = editData.dock;
    }
    setShowEditModal(false);
    alert('Данные пользователя обновлены!');
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/users')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{user.fullName}</h1>
        <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
          {ROLE_LABELS[user.role] || user.role}
        </span>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Контактная информация
            </h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500">Email</div>
                <div className="font-medium">{user.email}</div>
              </div>
            </div>
          </Card>
          
          <Card>
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Информация о роли
            </h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500">Роль</div>
                <div className="font-medium">{ROLE_LABELS[user.role] || user.role}</div>
              </div>
              {userData.dock && (
                <div>
                  <div className="text-sm text-gray-500">Док</div>
                  <div className="font-medium">{userData.dock}</div>
                </div>
              )}
              {userData.shipId && (
                <div>
                  <div className="text-sm text-gray-500">Привязанное судно</div>
                  <div className="font-medium">ID: {userData.shipId}</div>
                </div>
              )}
            </div>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <div className="text-center">
              <div className="h-24 w-24 bg-blue-100 rounded-full flex items-center justify-center text-5xl mx-auto mb-4">
                {user.avatar}
              </div>
              <h2 className="text-xl font-semibold">{user.fullName}</h2>
              <p className="text-gray-500">{ROLE_LABELS[user.role]}</p>
            </div>
          </Card>
          
          <Card>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-600">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">{isBlocked ? 'Заблокирован' : 'Активен'}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">{userData.dock || (userData.shipId ? `Судно #${userData.shipId}` : 'Нет')}</span>
              </div>
            </div>
          </Card>
          
          {canEdit && (
            <Card>
              <h2 className="font-semibold mb-4">Действия</h2>
              <div className="space-y-2">
                <Button variant="secondary" className="w-full" onClick={handleEditClick}>
                  Редактировать
                </Button>
                <Button 
                  variant="danger" 
                  className="w-full"
                  onClick={() => setShowBlockModal(true)}
                >
                  {isBlocked ? 'Разблокировать' : 'Заблокировать'}
                </Button>
                <Button 
                  variant="secondary" 
                  className="w-full"
                  onClick={handleResetPassword}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Сбросить пароль
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {showBlockModal && (
        <Modal isOpen={showBlockModal} onClose={() => setShowBlockModal(false)} title="Заблокировать пользователя" icon={UserX}>
          <div className="text-center">
            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserX className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {isBlocked ? 'Разблокировать пользователя?' : 'Заблокировать пользователя?'}
            </h3>
            <p className="text-gray-500 mb-6">
              {isBlocked 
                ? `${user.fullName} получит доступ к системе`
                : `${user.fullName} не сможет войти в систему. Все активные сессии будут завершены.`
              }
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowBlockModal(false)}>
                Отмена
              </Button>
              <Button variant="danger" className="flex-1" onClick={handleBlockUser}>
                {isBlocked ? 'Разблокировать' : 'Заблокировать'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showResetModal && (
        <Modal isOpen={showResetModal} onClose={() => setShowResetModal(false)} title="Сброс пароля" icon={RefreshCw}>
          <div className="text-center">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Пароль сброшен</h3>
            <p className="text-gray-500 mb-4">
              Временный пароль для {user.fullName}:
            </p>
            <div className="bg-gray-100 p-4 rounded-lg font-mono text-xl font-bold text-center mb-6">
              {tempPassword}
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Передайте этот пароль пользователю. При следующем входе будет предложено сменить пароль.
            </p>
            <Button className="w-full" onClick={() => setShowResetModal(false)}>
              Готово
            </Button>
          </div>
        </Modal>
      )}

      {showEditModal && (
        <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Редактировать пользователя" icon={Shield}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ФИО</label>
              <input
                type="text"
                value={editData.fullName}
                onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Роль</label>
              <select
                value={editData.role}
                onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="admin">Администратор</option>
                <option value="dispatcher">Диспетчер</option>
                <option value="operator">Оператор дока</option>
                <option value="master">Мастер участка</option>
                <option value="worker">Рабочий</option>
                <option value="client">Владелец судна</option>
              </select>
            </div>
            {['operator', 'master', 'worker'].includes(editData.role) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Док</label>
                <select
                  value={editData.dock}
                  onChange={(e) => setEditData({ ...editData, dock: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Выберите док</option>
                  <option value="Северный (200м)">Северный (200м)</option>
                  <option value="Западный (180м)">Западный (180м)</option>
                  <option value="Восточный (150м)">Восточный (150м)</option>
                  <option value="Южный (120м)">Южный (120м)</option>
                </select>
              </div>
            )}
            <div className="flex gap-3 pt-4">
              <Button variant="secondary" className="flex-1" onClick={() => setShowEditModal(false)}>
                Отмена
              </Button>
              <Button className="flex-1" onClick={handleSaveEdit}>
                Сохранить
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}