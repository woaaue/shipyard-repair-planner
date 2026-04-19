import { useState } from 'react';
import { Save, UserPlus } from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

interface UserFormProps {
  onClose: () => void;
  onSubmit?: (data: any) => void;
  docks?: string[];
}

const ROLES = [
  { value: 'admin', label: 'Администратор' },
  { value: 'operator', label: 'Оператор дока' },
  { value: 'master', label: 'Мастер участка' },
  { value: 'worker', label: 'Рабочий' },
  { value: 'client', label: 'Владелец судна' }
] as const;

export default function UserForm({ onClose, onSubmit, docks = [] }: UserFormProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: ROLES[4].value as string,
    dock: '',
    shipId: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    }
    onClose();
  };

  const showDock = ['operator', 'master', 'worker'].includes(formData.role);
  const showShipId = formData.role === 'client';

  return (
    <Modal isOpen={true} onClose={onClose} title="Добавить пользователя" icon={UserPlus}>
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ФИО *</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Иванов И.И."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="user@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Пароль *</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              minLength={6}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Роль *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {showDock && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Док *</label>
              <select
                value={formData.dock}
                onChange={(e) => setFormData({ ...formData, dock: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">IMO судна *</label>
              <input
                type="number"
                value={formData.shipId}
                onChange={(e) => setFormData({ ...formData, shipId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="9456789"
                required
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit">
            <Save className="h-4 w-4 mr-2" />
            Добавить пользователя
          </Button>
        </div>
      </form>
    </Modal>
  );
}
