import { useState } from 'react';
import { Save, UserPlus } from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import type { User } from '../../context/AuthContext';

interface UserFormProps {
  onClose: () => void;
  onSubmit?: (data: {
    fullName: string;
    email: string;
    password: string;
    role: User['role'];
    dock?: string;
    shipId?: string;
    reportsToUserId?: number;
  }) => Promise<void> | void;
  docks?: string[];
  users?: User[];
}

const ROLES = [
  { value: 'admin', label: 'Администратор' },
  { value: 'operator', label: 'Оператор дока' },
  { value: 'master', label: 'Мастер участка' },
  { value: 'worker', label: 'Рабочий' },
  { value: 'client', label: 'Клиент' }
] as const;

const SUPERVISOR_ROLE_BY_ROLE: Partial<Record<User['role'], User['role']>> = {
  worker: 'master',
  master: 'operator',
  operator: 'dispatcher',
};

export default function UserForm({ onClose, onSubmit, docks = [], users = [] }: UserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: ROLES[4].value as User['role'],
    dock: '',
    shipId: '',
    reportsToUserId: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await onSubmit?.({
        ...formData,
        reportsToUserId: formData.reportsToUserId ? Number(formData.reportsToUserId) : undefined,
      });
      onClose();
    } catch {
      setError('Не удалось создать пользователя');
    } finally {
      setIsSubmitting(false);
    }
  };

  const showDock = ['operator', 'master', 'worker'].includes(formData.role);
  const showShipId = formData.role === 'client';
  const requiredSupervisorRole = SUPERVISOR_ROLE_BY_ROLE[formData.role];
  const supervisorCandidates = users.filter((candidate) => candidate.role === requiredSupervisorRole);

  return (
    <Modal isOpen={true} onClose={onClose} title="Добавить пользователя" icon={UserPlus} bodyClassName="p-0">
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="px-4 py-3 rounded-lg border bg-[var(--danger-bg)] border-[var(--danger-line)] text-[var(--danger-ink)] text-sm">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-1">ФИО *</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
              placeholder="Иванов И.И."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-1">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
              placeholder="user@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-1">Пароль *</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
              minLength={6}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-1">Роль *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}
              className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
              required
            >
              {ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {showDock && (
            <div>
              <label className="block text-sm font-medium text-[var(--muted)] mb-1">Док *</label>
              <select
                value={formData.dock}
                onChange={(e) => setFormData({ ...formData, dock: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
                required
              >
                <option value="">Выберите док</option>
                {docks.map(dock => (
                  <option key={dock} value={dock}>{dock}</option>
                ))}
              </select>
            </div>
          )}

          {showShipId && (
            <div>
              <label className="block text-sm font-medium text-[var(--muted)] mb-1">IMO судна *</label>
              <input
                type="number"
                value={formData.shipId}
                onChange={(e) => setFormData({ ...formData, shipId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
                placeholder="9456789"
                required
              />
            </div>
          )}

          {requiredSupervisorRole && (
            <div>
              <label className="block text-sm font-medium text-[var(--muted)] mb-1">Руководитель *</label>
              <select
                value={formData.reportsToUserId}
                onChange={(e) => setFormData({ ...formData, reportsToUserId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
                required
              >
                <option value="">Выберите руководителя</option>
                {supervisorCandidates.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.fullName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--line)]">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Отмена
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Сохранение...' : 'Добавить пользователя'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
