import { useEffect, useState } from 'react';
import { Save, Wrench } from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { getDocks } from '../../services/docks';
import { getShips } from '../../services/ships';

interface RepairFormProps {
  onClose: () => void;
  onSubmit?: (data: any) => Promise<void> | void;
}

const REPAIR_TYPES = ['Доковый ремонт', 'Текущий ремонт', 'Средний ремонт', 'Капитальный ремонт', 'Аварийный ремонт'];
const PRIORITIES = ['низкий', 'средний', 'высокий', 'критический'] as const;

export default function RepairForm({ onClose, onSubmit }: RepairFormProps) {
  const { user } = useAuth();
  const [ships, setShips] = useState<Array<{ id: number; name: string; imo: string }>>([]);
  const [docks, setDocks] = useState<Array<{ id: number; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    shipId: '',
    dock: '',
    repairType: REPAIR_TYPES[0] as string,
    priority: 'средний' as (typeof PRIORITIES)[number],
    startDate: '',
    endDate: '',
    budget: '',
    manager: '',
    description: '',
  });

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [shipsData, docksData] = await Promise.all([getShips(), getDocks()]);
        setShips(shipsData.map((ship) => ({ id: ship.id, name: ship.name, imo: ship.imo })));
        setDocks(docksData.map((dock) => ({ id: dock.id, name: dock.name })));
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await onSubmit?.(formData);
      onClose();
    } catch {
      setError('Не удалось создать ремонт.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canEditDock = user?.role === 'admin' || user?.role === 'dispatcher' || user?.role === 'operator';

  return (
    <Modal isOpen={true} onClose={onClose} title="Создание ремонта" icon={Wrench} size="lg" bodyClassName="p-0">
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="px-4 py-3 rounded-lg border bg-[var(--danger-bg)] border-[var(--danger-line)] text-[var(--danger-ink)] text-sm">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-1">Судно *</label>
            <select
              value={formData.shipId}
              onChange={(e) => setFormData({ ...formData, shipId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
              required
              disabled={isLoading || isSubmitting}
            >
              <option value="">Выберите судно</option>
              {ships.map((ship) => (
                <option key={ship.id} value={ship.id}>
                  {ship.name} (IMO: {ship.imo})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-1">Док *</label>
            <select
              value={formData.dock}
              onChange={(e) => setFormData({ ...formData, dock: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
              required
              disabled={!canEditDock || isLoading || isSubmitting}
            >
              <option value="">Выберите док</option>
              {docks.map((dock) => (
                <option key={dock.id} value={dock.name}>
                  {dock.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-1">Тип ремонта *</label>
            <select
              value={formData.repairType}
              onChange={(e) => setFormData({ ...formData, repairType: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
              required
              disabled={isSubmitting}
            >
              {REPAIR_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-1">Приоритет</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as (typeof PRIORITIES)[number] })}
              className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
              disabled={isSubmitting}
            >
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-1">Дата начала *</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-1">Дата окончания *</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-1">Бюджет (руб.)</label>
            <input
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-1">Ответственный</label>
            <input
              type="text"
              value={formData.manager}
              onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--muted)] mb-1">Описание работ *</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--line)]">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Отмена
          </Button>
          <Button type="submit" disabled={isLoading || isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Сохранение...' : 'Создать ремонт'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
