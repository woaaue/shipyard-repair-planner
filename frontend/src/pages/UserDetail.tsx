import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Shield, MapPin, Calendar, UserX, RefreshCw, ShieldCheck } from 'lucide-react';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { useAuth, type User as AuthUser } from '../context/AuthContext';
import { blockUser, getSubordinates, getUser, getUsers, resetPassword, unblockUser, updateUser } from '../services/users';
import V7PageHeader from '../components/v7/V7PageHeader';
import V7Panel from '../components/v7/V7Panel';
import V7PanelTitle from '../components/v7/V7PanelTitle';
import { ROLE_UI_LABELS } from '../constants/labels';

const ROLE_LABELS: Record<string, string> = ROLE_UI_LABELS;

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
  const [subordinateIds, setSubordinateIds] = useState<Set<number>>(new Set());
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
      const [data, allUsers, subordinates] = await Promise.all([
        getUser(userId),
        getUsers(),
        typeof currentUser?.id === 'number' ? getSubordinates(currentUser.id) : Promise.resolve([]),
      ]);
      setUser(data);
      setUsers(allUsers);
      setSubordinateIds(new Set(subordinates.map((item) => item.id)));
      setSelectedSupervisor(data.reportsToUserId ? String(data.reportsToUserId) : '');
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadUser();
  }, [currentUser?.id, userId]);

  if (isLoading) {
    return <div className="text-center py-12 text-[var(--muted)]">Загрузка...</div>;
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-[var(--ink)]">Пользователь не найден</h2>
        <Button onClick={() => navigate('/users')} className="mt-4">
          Вернуться к списку
        </Button>
      </div>
    );
  }

  const canAccessUser =
    currentUser?.role === 'admin' ||
    currentUser?.id === user.id ||
    subordinateIds.has(user.id);

  const canEdit =
    currentUser?.role === 'admin' ||
    ((currentUser?.role === 'dispatcher' || currentUser?.role === 'operator' || currentUser?.role === 'master') &&
      subordinateIds.has(user.id));

  if (!canAccessUser) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-[var(--ink)]">Доступ ограничен</h2>
        <p className="text-[var(--muted)] mt-2">Вы можете просматривать только свой профиль и своих подчиненных.</p>
        <Button onClick={() => navigate('/users')} className="mt-4">
          Вернуться к списку
        </Button>
      </div>
    );
  }

  const requiredSupervisorRole = user ? requiredSupervisorRoleByRole[user.role as AuthUser['role']] : undefined;
  const supervisorCandidates = users.filter((candidate) => {
    if (candidate.role !== requiredSupervisorRole) return false;
    if (currentUser?.role === 'admin') return true;
    return subordinateIds.has(candidate.id) || candidate.id === currentUser?.id;
  });

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
      <V7PageHeader
        title={user.fullName}
        description={`Профиль пользователя · ${ROLE_LABELS[user.role] || user.role}`}
        actions={
          <Button variant="secondary" onClick={() => navigate('/users')} icon={ArrowLeft}>
            К списку
          </Button>
        }
      />

      {error && <div className="px-4 py-3 rounded-lg border bg-[var(--danger-bg)] border-[var(--danger-line)] text-[var(--danger-ink)]">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <V7Panel>
            <V7PanelTitle title="Контактная информация" extra={<Mail className="h-4 w-4 text-[var(--muted)]" />} />
            <div className="space-y-4">
              <div>
                <div className="text-sm text-[var(--muted)]">Email</div>
                <div className="font-medium">{user.email}</div>
              </div>
            </div>
          </V7Panel>

          <V7Panel>
            <V7PanelTitle title="Информация о роли" extra={<Shield className="h-4 w-4 text-[var(--muted)]" />} />
            <div className="space-y-4">
              <div>
                <div className="text-sm text-[var(--muted)]">Роль</div>
                <div className="font-medium">{ROLE_LABELS[user.role] || user.role}</div>
              </div>
              <div>
                <div className="text-sm text-[var(--muted)]">Док</div>
                <div className="font-medium">{user.dock || 'Не привязан'}</div>
              </div>
              {user.role !== 'dispatcher' && (
                <div>
                  <div className="text-sm text-[var(--muted)]">Руководитель</div>
                  <div className="font-medium">{user.reportsToFullName || 'Не назначен'}</div>
                </div>
              )}
            </div>
          </V7Panel>

          {canEdit && requiredSupervisorRole && (
            <V7Panel>
              <V7PanelTitle title="Подчиненность" />
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--muted)] mb-1">Руководитель ({ROLE_LABELS[requiredSupervisorRole]})</label>
                  <select
                    value={selectedSupervisor}
                    onChange={(event) => setSelectedSupervisor(event.target.value)}
                    className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
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
            </V7Panel>
          )}
        </div>

        <div className="space-y-6">
          <V7Panel>
            <div className="text-center">
              <div className="h-24 w-24 bg-[var(--soft)] border border-[var(--line)] rounded-full flex items-center justify-center text-3xl font-bold text-[var(--ink)] mx-auto mb-4">
                {getInitials(user.fullName)}
              </div>
              <h2 className="text-xl font-semibold">{user.fullName}</h2>
              <p className="text-[var(--muted)]">{ROLE_LABELS[user.role] || user.role}</p>
            </div>
          </V7Panel>

          <V7Panel>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-[var(--muted)]">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Активен</span>
              </div>
              <div className="flex items-center gap-3 text-[var(--muted)]">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">{user.dock || 'Док не назначен'}</span>
              </div>
            </div>
          </V7Panel>

          {canEdit && (
            <V7Panel>
              <V7PanelTitle title="Действия" />
              <div className="space-y-2">
                <div className="rounded-lg border border-[var(--line)] bg-[var(--soft)] px-3 py-2 text-sm text-[var(--muted)]">
                  Статус учетной записи: <span className="font-semibold text-[var(--ink)]">{user.enabled === false ? 'Заблокирована' : 'Активна'}</span>
                </div>
                {user.enabled === false ? (
                  <Button variant="secondary" className="w-full" onClick={() => setShowUnblockModal(true)} disabled={isActionLoading}>
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Разблокировать
                  </Button>
                ) : (
                  <Button variant="danger" className="w-full" onClick={() => setShowBlockModal(true)} disabled={isActionLoading}>
                    <UserX className="h-4 w-4 mr-2" />
                    Заблокировать
                  </Button>
                )}
                <Button variant="secondary" className="w-full" onClick={() => setShowResetModal(true)} disabled={isActionLoading}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Сбросить пароль
                </Button>
              </div>
            </V7Panel>
          )}
        </div>
      </div>

      {showBlockModal && (
        <Modal isOpen={showBlockModal} onClose={() => setShowBlockModal(false)} title="Блокировка пользователя" icon={UserX}>
          <div className="text-center">
            <p className="text-[var(--muted)] mb-4">Подтвердите блокировку пользователя.</p>
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
            <p className="text-[var(--muted)] mb-4">Подтвердите разблокировку пользователя.</p>
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
            <p className="text-[var(--muted)] mb-4">Будет сгенерирован временный пароль.</p>
            {tempPassword && (
              <div className="bg-[var(--soft)] border border-[var(--line)] p-3 rounded-lg mb-4 font-mono text-lg">{tempPassword}</div>
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

