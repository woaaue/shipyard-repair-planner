import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Shield, MapPin, Calendar, UserX, RefreshCw, ShieldCheck } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { useAuth, type User as AuthUser } from '../context/AuthContext';
import { blockUser, getUser, getUsers, resetPassword, unblockUser, updateUser } from '../services/users';

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

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showUnblockModal, setShowUnblockModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const requiredSupervisorRoleByRole: Partial<Record<AuthUser['role'], AuthUser['role']>> = {
    worker: 'master',
    master: 'operator',
    operator: 'dispatcher',
  };

  const userId = useMemo(() => Number(id || '0'), [id]);

  const loadUser = async () => {
    if (!userId) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [data, allUsers] = await Promise.all([getUser(userId), getUsers()]);
      setUser(data);
      setUsers(allUsers);
      setSelectedSupervisor(data.reportsToUserId ? String(data.reportsToUserId) : '');
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadUser();
  }, [userId]);

  if (isLoading) {
    return <div className="text-center py-12 text-gray-600">Загрузка...</div>;
  }

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

  const canEdit = currentUser?.role === 'admin';
  const requiredSupervisorRole = user ? requiredSupervisorRoleByRole[user.role as AuthUser['role']] : undefined;
  const supervisorCandidates = users.filter((candidate) => candidate.role === requiredSupervisorRole);

  const handleBlock = async () => {
    if (!userId) return;
    setError(null);
    setIsActionLoading(true);
    try {
      const updated = await blockUser(userId);
      setUser(updated);
      setShowBlockModal(false);
    } catch {
      setError('Не удалось заблокировать пользователя');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUnblock = async () => {
    if (!userId) return;
    setError(null);
    setIsActionLoading(true);
    try {
      const updated = await unblockUser(userId);
      setUser(updated);
      setShowUnblockModal(false);
    } catch {
      setError('Не удалось разблокировать пользователя');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!userId) return;
    setError(null);
    setIsActionLoading(true);
    try {
      const password = await resetPassword(userId);
      setTempPassword(password);
    } catch {
      setError('Не удалось сбросить пароль');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSupervisorSave = async () => {
    if (!user) return;

    setError(null);
    setIsActionLoading(true);
    try {
      const { id, ...restUser } = user;
      const updated = await updateUser(user.id, {
        ...restUser,
        reportsToUserId: selectedSupervisor ? Number(selectedSupervisor) : null,
      });
      setUser(updated);
    } catch {
      setError('Не удалось обновить руководителя');
    } finally {
      setIsActionLoading(false);
    }
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
        <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">{ROLE_LABELS[user.role] || user.role}</span>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

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
              <div>
                <div className="text-sm text-gray-500">Док</div>
                <div className="font-medium">{user.dock || 'Не привязан'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Руководитель</div>
                <div className="font-medium">{user.reportsToFullName || 'Не назначен'}</div>
              </div>
            </div>
          </Card>

          {canEdit && requiredSupervisorRole && (
            <Card>
              <h2 className="font-semibold mb-4">Подчиненность</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Руководитель ({ROLE_LABELS[requiredSupervisorRole]})</label>
                  <select
                    value={selectedSupervisor}
                    onChange={(event) => setSelectedSupervisor(event.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Не назначен</option>
                    {supervisorCandidates.map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>
                        {candidate.fullName}
                      </option>
                    ))}
                  </select>
                </div>
                <Button onClick={() => void handleSupervisorSave()} disabled={isActionLoading}>
                  Сохранить руководителя
                </Button>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <div className="text-center">
              <div className="h-24 w-24 bg-blue-100 rounded-full flex items-center justify-center text-3xl font-bold text-blue-700 mx-auto mb-4">
                {getInitials(user.fullName)}
              </div>
              <h2 className="text-xl font-semibold">{user.fullName}</h2>
              <p className="text-gray-500">{ROLE_LABELS[user.role] || user.role}</p>
            </div>
          </Card>

          <Card>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-600">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Активен</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">{user.dock || 'Нет'}</span>
              </div>
            </div>
          </Card>

          {canEdit && (
            <Card>
              <h2 className="font-semibold mb-4">Действия</h2>
              <div className="space-y-2">
                <Button variant="secondary" className="w-full" disabled>
                  Редактирование (скоро)
                </Button>
                <Button variant="danger" className="w-full" onClick={() => setShowBlockModal(true)} disabled={isActionLoading}>
                  <UserX className="h-4 w-4 mr-2" />
                  Заблокировать
                </Button>
                <Button variant="secondary" className="w-full" onClick={() => setShowUnblockModal(true)} disabled={isActionLoading}>
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Разблокировать
                </Button>
                <Button variant="secondary" className="w-full" onClick={() => setShowResetModal(true)} disabled={isActionLoading}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Сбросить пароль
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {showBlockModal && (
        <Modal isOpen={showBlockModal} onClose={() => setShowBlockModal(false)} title="Блокировка пользователя" icon={UserX}>
          <div className="text-center">
            <p className="text-gray-600 mb-4">Подтвердите блокировку пользователя.</p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowBlockModal(false)} disabled={isActionLoading}>
                Отмена
              </Button>
              <Button className="flex-1" onClick={() => void handleBlock()} disabled={isActionLoading}>
                {isActionLoading ? 'Выполнение...' : 'Подтвердить'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showUnblockModal && (
        <Modal isOpen={showUnblockModal} onClose={() => setShowUnblockModal(false)} title="Разблокировка пользователя" icon={ShieldCheck}>
          <div className="text-center">
            <p className="text-gray-600 mb-4">Подтвердите разблокировку пользователя.</p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowUnblockModal(false)} disabled={isActionLoading}>
                Отмена
              </Button>
              <Button className="flex-1" onClick={() => void handleUnblock()} disabled={isActionLoading}>
                {isActionLoading ? 'Выполнение...' : 'Подтвердить'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showResetModal && (
        <Modal isOpen={showResetModal} onClose={() => { setShowResetModal(false); setTempPassword(''); }} title="Сброс пароля" icon={RefreshCw}>
          <div className="text-center">
            <p className="text-gray-600 mb-4">Будет сгенерирован временный пароль.</p>
            {tempPassword && (
              <div className="bg-gray-100 p-3 rounded-lg mb-4 font-mono text-lg">{tempPassword}</div>
            )}
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => { setShowResetModal(false); setTempPassword(''); }} disabled={isActionLoading}>
                Закрыть
              </Button>
              <Button className="flex-1" onClick={() => void handleResetPassword()} disabled={isActionLoading}>
                {isActionLoading ? 'Выполнение...' : 'Сбросить'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
