import { useState } from 'react';
import { Save, Ship } from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { useAuth } from '../../context/AuthContext';

interface ShipFormProps {
  onClose: () => void;
  onSubmit?: (data: any) => void;
}

const SHIP_TYPES = ['Контейнеровоз', 'Танкер', 'Балкер', 'Ролкер'] as const;
const SHIP_STATUSES = ['в плавании', 'ожидает', 'в ремонте'] as const;

export default function ShipForm({ onClose, onSubmit }: ShipFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    imo: '',
    type: SHIP_TYPES[0] as string,
    status: SHIP_STATUSES[1] as string,
    buildYear: '',
    owner: '',
    lastRepairDate: '',
    nextRepairDate: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    }
    onClose();
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
            <label className="block text-sm font-medium text-gray-700 mb-1">IMO номер *</label>
            <input
              type="text"
              value={formData.imo}
              onChange={(e) => setFormData({ ...formData, imo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={7}
              placeholder="9456789"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Год постройки *</label>
            <input
              type="number"
              value={formData.buildYear}
              onChange={(e) => setFormData({ ...formData, buildYear: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={1900}
              max={new Date().getFullYear()}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Владелец *</label>
            <input
              type="text"
              value={formData.owner}
              onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Дата последнего ремонта</label>
            <input
              type="date"
              value={formData.lastRepairDate}
              onChange={(e) => setFormData({ ...formData, lastRepairDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Дата следующего ремонта</label>
            <input
              type="date"
              value={formData.nextRepairDate}
              onChange={(e) => setFormData({ ...formData, nextRepairDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit">
            <Save className="h-4 w-4 mr-2" />
            Добавить судно
          </Button>
        </div>
      </form>
    </Modal>
  );
}