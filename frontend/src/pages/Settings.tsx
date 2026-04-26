import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Save, Plus, X, Trash2 } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { createDock, deleteDock, getDocks } from '../services/docks';
import type { Dock } from '../services/docks';

const REPAIR_TYPES = ['Dry Dock', 'Current Repair', 'Intermediate Repair', 'Major Repair', 'Emergency Repair'];

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'general' | 'docks' | 'repairs'>('general');
  const [showAddDock, setShowAddDock] = useState(false);
  const [newDockName, setNewDockName] = useState('');
  const [newDockLength, setNewDockLength] = useState('150');
  const [docks, setDocks] = useState<Dock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDocks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getDocks();
      setDocks(data);
    } catch {
      setError('Failed to load docks.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDocks();
  }, []);

  const handleAddDock = async () => {
    if (!newDockName.trim()) return;

    const length = Number.parseInt(newDockLength, 10);
    if (!Number.isFinite(length) || length <= 0) return;

    try {
      await createDock({
        name: newDockName.trim(),
        length,
        capacity: length * 30,
        status: 'active',
      });
      setNewDockName('');
      setNewDockLength('150');
      setShowAddDock(false);
      await loadDocks();
    } catch {
      setError('Failed to create dock.');
    }
  };

  const handleDeleteDock = async (dockId: number) => {
    try {
      await deleteDock(dockId);
      setDocks((prev) => prev.filter((dock) => dock.id !== dockId));
    } catch {
      setError('Failed to delete dock.');
    }
  };

  const tabs = [
    { id: 'general', name: 'General' },
    { id: 'docks', name: 'Docks' },
    { id: 'repairs', name: 'Repair Types' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <SettingsIcon className="h-8 w-8 text-gray-600" />
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

      <div className="flex gap-4 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {activeTab === 'general' && (
        <Card>
          <h2 className="font-semibold mb-4">General Settings</h2>
          <div className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
              <input
                type="text"
                defaultValue="Dock Plan"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>RUB (R)</option>
                <option>USD ($)</option>
                <option>EUR (EUR)</option>
              </select>
            </div>
            <Button>
              <Save className="h-4 w-4 mr-2" />
              Save changes
            </Button>
          </div>
        </Card>
      )}

      {activeTab === 'docks' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Dock Management</h2>
            <Button size="sm" onClick={() => setShowAddDock(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add dock
            </Button>
          </div>

          {showAddDock && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg space-y-2">
              <input
                type="text"
                value={newDockName}
                onChange={(e) => setNewDockName(e.target.value)}
                placeholder="Dock name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="number"
                value={newDockLength}
                onChange={(e) => setNewDockLength(e.target.value)}
                placeholder="Length (m)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <div className="flex gap-2">
                <Button onClick={handleAddDock}>Create</Button>
                <Button variant="secondary" onClick={() => setShowAddDock(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {isLoading ? (
              <div className="text-gray-500 text-center py-4">Loading...</div>
            ) : (
              docks.map((dock) => (
                <div key={dock.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">{dock.name}</div>
                    <div className="text-sm text-gray-500">Length: {dock.length}m</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        dock.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {dock.status}
                    </span>
                    <button
                      className="text-gray-400 hover:text-red-600"
                      onClick={() => void handleDeleteDock(dock.id)}
                      aria-label={`Delete dock ${dock.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {activeTab === 'repairs' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Repair Types</h2>
            <Button size="sm" disabled>
              <Plus className="h-4 w-4 mr-1" />
              Add type
            </Button>
          </div>
          <div className="space-y-2">
            {REPAIR_TYPES.map((type) => (
              <div key={type} className="flex items-center justify-between p-3 border rounded-lg">
                <span>{type}</span>
                <button className="text-gray-400 hover:text-gray-600" disabled>
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
