import { useEffect, useState } from 'react';
import { Save, Wrench } from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { getDocks } from '../../services/docks';
import { getShips } from '../../services/ships';

interface RepairFormProps {
  onClose: () => void;
  onSubmit?: (data: any) => void;
}

const REPAIR_TYPES = ['Dry Dock', 'Current Repair', 'Intermediate Repair', 'Major Repair', 'Emergency Repair'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;

export default function RepairForm({ onClose, onSubmit }: RepairFormProps) {
  const { user } = useAuth();
  const [ships, setShips] = useState<Array<{ id: number; name: string; imo: string }>>([]);
  const [docks, setDocks] = useState<Array<{ id: number; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    shipId: '',
    dock: '',
    repairType: REPAIR_TYPES[0] as string,
    priority: 'medium' as (typeof PRIORITIES)[number],
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(formData);
    onClose();
  };

  const canEditDock = user?.role === 'admin' || user?.role === 'dispatcher' || user?.role === 'operator';

  return (
    <Modal isOpen={true} onClose={onClose} title="Create repair" icon={Wrench} size="lg">
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ship *</label>
            <select
              value={formData.shipId}
              onChange={(e) => setFormData({ ...formData, shipId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={isLoading}
            >
              <option value="">Select ship</option>
              {ships.map((ship) => (
                <option key={ship.id} value={ship.id}>
                  {ship.name} (IMO: {ship.imo})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dock *</label>
            <select
              value={formData.dock}
              onChange={(e) => setFormData({ ...formData, dock: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={!canEditDock || isLoading}
            >
              <option value="">Select dock</option>
              {docks.map((dock) => (
                <option key={dock.id} value={dock.name}>
                  {dock.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Repair type *</label>
            <select
              value={formData.repairType}
              onChange={(e) => setFormData({ ...formData, repairType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {REPAIR_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as (typeof PRIORITIES)[number] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start date *</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End date *</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget (RUB)</label>
            <input
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Manager</label>
            <input
              type="text"
              value={formData.manager}
              onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Work description *</label>
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
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            Create repair
          </Button>
        </div>
      </form>
    </Modal>
  );
}
