import { useState } from 'react';
import { Send, ClipboardList, Ship } from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

interface ExistingShipInput {
  mode: 'existing';
  shipId: string;
  repairType: string;
  description: string;
  desiredDate?: string;
  urgency: string;
}

interface NewShipInput {
  mode: 'new';
  newShip: {
    name: string;
    imo: string;
    type: string;
    length: string;
    width: string;
    draft: string;
  };
  repairType: string;
  description: string;
  desiredDate?: string;
  urgency: string;
}

export type RepairRequestFormData = ExistingShipInput | NewShipInput;

interface RepairRequestFormProps {
  onClose: () => void;
  onSubmit?: (data: RepairRequestFormData) => Promise<void> | void;
  ships?: Array<{ id: number; name: string; imo: string }>;
  allowNewShip?: boolean;
}

const REPAIR_TYPES = [
  'Доковый ремонт',
  'Текущий ремонт',
  'Средний ремонт',
  'Капитальный ремонт',
  'Аварийный ремонт'
] as const;

const SHIP_TYPES = ['Контейнеровоз', 'Танкер', 'Балкер', 'Ролкер', 'Другое'] as const;

export default function RepairRequestForm({ onClose, onSubmit, ships = [], allowNewShip = false }: RepairRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<'existing' | 'new'>(allowNewShip && ships.length === 0 ? 'new' : 'existing');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    shipId: '',
    repairType: REPAIR_TYPES[0] as string,
    description: '',
    desiredDate: '',
    urgency: 'обычный' as string,
    newShip: {
      name: '',
      imo: '',
      type: SHIP_TYPES[0] as string,
      length: '100',
      width: '20',
      draft: '8',
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.description.trim()) {
      setError('Опишите необходимые работы');
      return;
    }

    if (mode === 'existing' && !formData.shipId) {
      setError('Выберите судно или добавьте новое');
      return;
    }

    if (mode === 'new') {
      const { name, imo, length, width, draft } = formData.newShip;
      if (!name.trim() || !imo.trim()) {
        setError('Укажите название и регистрационный номер судна');
        return;
      }
      if (Number(length) <= 0 || Number(width) <= 0 || Number(draft) <= 0) {
        setError('Размеры судна должны быть больше нуля');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (mode === 'new') {
        await onSubmit?.({
          mode: 'new',
          newShip: formData.newShip,
          repairType: formData.repairType,
          description: formData.description,
          desiredDate: formData.desiredDate,
          urgency: formData.urgency,
        });
      } else {
        await onSubmit?.({
          mode: 'existing',
          shipId: formData.shipId,
          repairType: formData.repairType,
          description: formData.description,
          desiredDate: formData.desiredDate,
          urgency: formData.urgency,
        });
      }
      onClose();
    } catch {
      setError('Не удалось отправить заявку');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Заявка на ремонт" icon={ClipboardList}>
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-700">
          Заполните заявку на ремонт. Наш менеджер свяжется с вами для уточнения деталей.
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {allowNewShip && (
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setMode('existing')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'existing' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Выбрать судно
            </button>
            <button
              type="button"
              onClick={() => setMode('new')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'new' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Добавить новое
            </button>
          </div>
        )}

        <div className="space-y-4">
          {mode === 'existing' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Судно *</label>
              <select
                value={formData.shipId}
                onChange={(e) => setFormData({ ...formData, shipId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Выберите судно</option>
                {ships.map((ship) => (
                  <option key={ship.id} value={ship.id}>{ship.name} (IMO: {ship.imo})</option>
                ))}
              </select>
              {allowNewShip && ships.length === 0 && (
                <p className="mt-2 text-sm text-gray-500">У вас пока нет судов. Переключитесь на “Добавить новое”.</p>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 p-4 space-y-4">
              <div className="flex items-center gap-2 font-medium text-gray-900">
                <Ship className="h-4 w-4 text-blue-600" />
                Новое судно
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
                  <input
                    type="text"
                    value={formData.newShip.name}
                    onChange={(e) => setFormData({ ...formData, newShip: { ...formData.newShip, name: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Рег. номер / IMO *</label>
                  <input
                    type="text"
                    value={formData.newShip.imo}
                    onChange={(e) => setFormData({ ...formData, newShip: { ...formData.newShip, imo: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    minLength={6}
                    maxLength={20}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Тип судна</label>
                  <select
                    value={formData.newShip.type}
                    onChange={(e) => setFormData({ ...formData, newShip: { ...formData.newShip, type: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {SHIP_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Длина</label>
                    <input
                      type="number"
                      value={formData.newShip.length}
                      onChange={(e) => setFormData({ ...formData, newShip: { ...formData.newShip, length: e.target.value } })}
                      className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Ширина</label>
                    <input
                      type="number"
                      value={formData.newShip.width}
                      onChange={(e) => setFormData({ ...formData, newShip: { ...formData.newShip, width: e.target.value } })}
                      className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Осадка</label>
                    <input
                      type="number"
                      value={formData.newShip.draft}
                      onChange={(e) => setFormData({ ...formData, newShip: { ...formData.newShip, draft: e.target.value } })}
                      className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min={1}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Тип ремонта *</label>
            <select
              value={formData.repairType}
              onChange={(e) => setFormData({ ...formData, repairType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {REPAIR_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
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
          <Button type="submit" disabled={isSubmitting}>
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Отправка...' : 'Отправить заявку'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
