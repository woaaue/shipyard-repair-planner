import { useState } from 'react';
import { Send, ClipboardList } from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { mockShips } from '../../mock-data/data';

interface RepairRequestFormProps {
  onClose: () => void;
  onSubmit?: (data: any) => void;
}

const REPAIR_TYPES = [
  'Доковый ремонт',
  'Текущий ремонт',
  'Средний ремонт',
  'Капитальный ремонт',
  'Аварийный ремонт'
] as const;

export default function RepairRequestForm({ onClose, onSubmit }: RepairRequestFormProps) {
  const [formData, setFormData] = useState({
    shipId: '',
    repairType: REPAIR_TYPES[0] as string,
    description: '',
    desiredDate: '',
    urgency: 'обычный' as string
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    }
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Заявка на ремонт" icon={ClipboardList}>
      <div className="p-6 space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-700">
          Заполните заявку на ремонт. Наш менеджер свяжется с вами для уточнения деталей.
        </div>

        <div className="space-y-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Тип ремонта *</label>
            <select
              value={formData.repairType}
              onChange={(e) => setFormData({ ...formData, repairType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {REPAIR_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Желаемая дата</label>
            <input
              type="date"
              value={formData.desiredDate}
              onChange={(e) => setFormData({ ...formData, desiredDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Срочность</label>
            <select
              value={formData.urgency}
              onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="обычный">Обычный</option>
              <option value="срочный">Срочный</option>
              <option value="аварийный">Аварийный</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Описание необходимых работ *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Опишите необходимые работы, укажите выявленные проблемы..."
              required
            />
          </div>
        </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={onClose}>
              Отмена
            </Button>
            <Button type="button" onClick={() => {
              if (formData.shipId && formData.description) {
                handleSubmit(new Event('submit') as any);
              }
            }}>
              <Send className="h-4 w-4 mr-2" />
              Отправить заявку
            </Button>
          </div>
      </div>
    </Modal>
  );
}