import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Shield, MapPin, Calendar, UserX, RefreshCw } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { getUser } from '../services/users';

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

  const [user, setUser] = useState<{
    id: number;
    email: string;
    fullName: string;
    role: string;
    dock?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [tempPassword] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      if (!id) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const data = await getUser(id);
        setUser(data);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    void loadUser();
  }, [id]);

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
            </div>
          </Card>
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
                <Button variant="danger" className="w-full" onClick={() => setShowBlockModal(true)} disabled>
                  Заблокировать (скоро)
                </Button>
                <Button variant="secondary" className="w-full" onClick={() => setShowResetModal(true)} disabled>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Сбросить пароль (скоро)
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {showBlockModal && (
        <Modal isOpen={showBlockModal} onClose={() => setShowBlockModal(false)} title="Блокировка пользователя" icon={UserX}>
          <div className="text-center">
            <p className="text-gray-600 mb-4">Этот сценарий будет доступен после реализации endpoint на backend.</p>
            <Button className="w-full" onClick={() => setShowBlockModal(false)}>
              Понятно
            </Button>
          </div>
        </Modal>
      )}

      {showResetModal && (
        <Modal isOpen={showResetModal} onClose={() => setShowResetModal(false)} title="Сброс пароля" icon={RefreshCw}>
          <div className="text-center">
            <p className="text-gray-600 mb-4">Этот сценарий будет доступен после реализации endpoint на backend.</p>
            {tempPassword && (
              <div className="bg-gray-100 p-3 rounded-lg mb-4 font-mono text-lg">{tempPassword}</div>
            )}
            <Button className="w-full" onClick={() => setShowResetModal(false)}>
              Понятно
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
