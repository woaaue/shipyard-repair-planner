import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

interface DowntimeFormProps {
  onClose: () => void;
  onSubmit?: (data: any) => void;
  dockName?: string;
}

const DOWNTIME_REASONS = [
  'Погодные условия',
  'Отсутствие материалов',
  'Техническая поломка',
  'Отсутствие персонала',
  'Плановое техническое обслуживание',
  'Ожидание судна',
  'Другое'
] as const;

export default function DowntimeForm({ onClose, onSubmit, dockName }: DowntimeFormProps) {
  const [formData, setFormData] = useState({
    dock: dockName || '',
    reason: DOWNTIME_REASONS[0] as string,
    startDate: '',
    expectedEndDate: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    }
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Зафиксировать простой" icon={AlertCircle}>
      <div className="p-6 space-y-4">
        <div className="bg-yellow-50 p-3 rounded-lg text-sm text-yellow-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          Простой будет зафиксирован в системе и виден диспетчеру
        </div>

        {dockName && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Док</label>
            <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-700">{dockName}</div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Причина простоя *</label>
          <select
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            {DOWNTIME_REASONS.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Начало *</label>
            <input
              type="datetime-local"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ожидаемое окончание</label>
            <input
              type="datetime-local"
              value={formData.expectedEndDate}
              onChange={(e) => setFormData({ ...formData, expectedEndDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Комментарий</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Дополнительные комментарии..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button type="button" onClick={() => {
            if (formData.startDate && formData.reason) {
              handleSubmit(new Event('submit') as any);
            }
          }}>
            Зафиксировать простой
          </Button>
        </div>
      </div>
    </Modal>
  );
}