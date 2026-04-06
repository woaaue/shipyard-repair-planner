import { useState } from 'react';
import { Settings as SettingsIcon, Save, Plus, X } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { dockNames, addDock as addDockToData } from '../mock-data/data';

const REPAIR_TYPES = [
  'Доковый ремонт',
  'Текущий ремонт',
  'Средний ремонт',
  'Капитальный ремонт',
  'Аварийный ремонт'
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'general' | 'docks' | 'repairs'>('general');
  const [showAddDock, setShowAddDock] = useState(false);
  const [newDockName, setNewDockName] = useState('');
  
  const [docks, setDocks] = useState(() => dockNames.map((name, i) => ({
    id: i + 1,
    name,
    length: parseInt(name.match(/\d+/)?.[0] || '100'),
    active: true
  })));

  const handleAddDock = () => {
    if (newDockName.trim()) {
      const newDock = {
        id: docks.length + 1,
        name: newDockName as any,
        length: parseInt(newDockName.match(/\d+/)?.[0] || '100'),
        active: true
      };
      setDocks([...docks, newDock]);
      addDockToData(newDockName);
      setNewDockName('');
      setShowAddDock(false);
    }
  };

  const tabs = [
    { id: 'general', name: 'Общие настройки' },
    { id: 'docks', name: 'Доки' },
    { id: 'repairs', name: 'Типы ремонтов' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <SettingsIcon className="h-8 w-8 text-gray-600" />
        <h1 className="text-2xl font-bold text-gray-900">Настройки системы</h1>
      </div>

      <div className="flex gap-4 border-b">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
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
          <h2 className="font-semibold mb-4">Общие настройки</h2>
          <div className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Название организации</label>
              <input
                type="text"
                defaultValue="Док-План"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Валюта</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Рубль (₽)</option>
                <option>Доллар ($)</option>
                <option>Евро (€)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Часовой пояс</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Москва (UTC+3)</option>
                <option>Санкт-Петербург (UTC+3)</option>
                <option>Владивосток (UTC+10)</option>
              </select>
            </div>
            <Button>
              <Save className="h-4 w-4 mr-2" />
              Сохранить изменения
            </Button>
          </div>
        </Card>
      )}

      {activeTab === 'docks' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Управление доками</h2>
            <Button size="sm" onClick={() => setShowAddDock(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Добавить док
            </Button>
          </div>
          
          {showAddDock && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDockName}
                  onChange={(e) => setNewDockName(e.target.value)}
                  placeholder="Название дока (например, Центральный 250м)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
                <Button onClick={handleAddDock}>Добавить</Button>
                <Button variant="secondary" onClick={() => setShowAddDock(false)}>Отмена</Button>
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            {docks.map(dock => (
              <div key={dock.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">{dock.name}</div>
                  <div className="text-sm text-gray-500">Длина: {dock.length}м</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded ${dock.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {dock.active ? 'Активен' : 'Неактивен'}
                  </span>
                  <button className="text-gray-400 hover:text-gray-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'repairs' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Типы ремонтов</h2>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Добавить тип
            </Button>
          </div>
          <div className="space-y-2">
            {REPAIR_TYPES.map(type => (
              <div key={type} className="flex items-center justify-between p-3 border rounded-lg">
                <span>{type}</span>
                <button className="text-gray-400 hover:text-gray-600">
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