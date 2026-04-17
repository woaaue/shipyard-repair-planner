import { useState } from 'react';
import { Save, Ship } from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { useAuth } from '../../context/AuthContext';
import type { ShipFormPayload } from '../../services/ships';

interface ShipFormProps {
  onClose: () => void;
  onSubmit?: (data: ShipFormPayload) => Promise<void> | void;
}

const SHIP_TYPES = ['Контейнеровоз', 'Танкер', 'Балкер', 'Ролкер', 'Другое'] as const;
const SHIP_STATUSES = ['в плавании', 'ожидает', 'в ремонте'] as const;

export default function ShipForm({ onClose, onSubmit }: ShipFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    imo: '',
    type: SHIP_TYPES[0] as string,
    status: SHIP_STATUSES[1] as string,
    ownerId: user?.id ? String(user.id) : '',
    length: '100',
    width: '20',
    draft: '8',
    dockId: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSubmit) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: formData.name,
        imo: formData.imo,
        type: formData.type,
        status: formData.status,
        ownerId: Number(formData.ownerId),
        length: Number(formData.length),
        width: Number(formData.width),
        draft: Number(formData.draft),
        dockId: formData.dockId ? Number(formData.dockId) : undefined,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const canEdit = user?.role === 'admin';

  return (
    <Modal isOpen={true} onClose={onClose} title="Добавить судно" icon={Ship}>
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Рег. номер / IMO *</label>
            <input
              type="text"
              value={formData.imo}
              onChange={(e) => setFormData({ ...formData, imo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              minLength={6}
              maxLength={20}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Тип судна *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {SHIP_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Статус *</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={!canEdit}
            >
              {SHIP_STATUSES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID владельца *</label>
            <input
              type="number"
              value={formData.ownerId}
              onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={1}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID дока (опционально)</label>
            <input
              type="number"
              value={formData.dockId}
              onChange={(e) => setFormData({ ...formData, dockId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={1}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Длина (м) *</label>
            <input
              type="number"
              value={formData.length}
              onChange={(e) => setFormData({ ...formData, length: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={1}
              max={500}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ширина (м) *</label>
            <input
              type="number"
              value={formData.width}
              onChange={(e) => setFormData({ ...formData, width: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={1}
              max={100}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Осадка (м) *</label>
            <input
              type="number"
              value={formData.draft}
              onChange={(e) => setFormData({ ...formData, draft: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={1}
              max={30}
              required
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Сохранение...' : 'Добавить судно'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
