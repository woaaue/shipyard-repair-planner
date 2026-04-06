import { useState } from 'react';
import { Save, Wrench } from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { mockShips, dockNames, repairTypes } from '../../mock-data/data';
import { useAuth } from '../../context/AuthContext';

interface RepairFormProps {
  onClose: () => void;
  onSubmit?: (data: any) => void;
}

const PRIORITIES = ['низкий', 'средний', 'высокий', 'критический'] as const;

export default function RepairForm({ onClose, onSubmit }: RepairFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    shipId: '',
    dock: '',
    repairType: repairTypes[0] as string,
    priority: 'средний' as typeof PRIORITIES[number],
    startDate: '',
    endDate: '',
    budget: '',
    manager: '',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    }
    onClose();
  };

  const canEditDock = user?.role === 'admin' || user?.role === 'dispatcher' || user?.role === 'operator';

  return (
    <Modal isOpen={true} onClose={onClose} title="Создание ремонта" icon={Wrench} size="lg">
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Судно *</label>
            <select
              value={formData.shipId}
              onChange={(e) => setFormData({ ...formData, shipId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Выберите судно</option>
              {mockShips.map(ship => (
                <option key={ship.id} value={ship.id}>{ship.name} (IMO: {ship.imo})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Док *</label>
            <select
              value={formData.dock}
              onChange={(e) => setFormData({ ...formData, dock: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={!canEditDock}
            >
              <option value="">Выберите док</option>
              {dockNames.map(dock => (
                <option key={dock} value={dock}>{dock}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Тип ремонта *</label>
            <select
              value={formData.repairType}
              onChange={(e) => setFormData({ ...formData, repairType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {repairTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Приоритет</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as typeof PRIORITIES[number] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PRIORITIES.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Дата начала *</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Дата окончания *</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Бюджет (₽)</label>
            <input
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ответственный</label>
            <input
              type="text"
              value={formData.manager}
              onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Описание работ *</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit">
            <Save className="h-4 w-4 mr-2" />
            Создать ремонт
          </Button>
        </div>
      </form>
    </Modal>
  );
}