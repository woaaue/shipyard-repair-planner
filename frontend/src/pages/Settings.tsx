import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import Button from '../components/ui/Button';
import { createDock, deleteDock, getDocks, updateDock } from '../services/docks';
import type { Dock } from '../services/docks';
import {
  createShipyard,
  getShipyards,
  updateShipyardStatus,
  updateShipyard,
  type Shipyard,
  type ShipyardStatus,
} from '../services/shipyards';
import V7PageHeader from '../components/v7/V7PageHeader';
import V7Panel from '../components/v7/V7Panel';
import V7PanelTitle from '../components/v7/V7PanelTitle';

const LENGTH_MIN = 1;
const LENGTH_MAX = 500;
const WIDTH_MIN = 1;
const WIDTH_MAX = 100;
const DRAFT_MIN = 1;
const DRAFT_MAX = 30;

function getDockStatusLabel(status: Dock['status']): string {
  return status === 'active' ? 'Активен' : 'Неактивен';
}

function getShipyardStatusLabel(status: ShipyardStatus): string {
  if (status === 'ACTIVE') return 'Активна';
  if (status === 'MAINTENANCE') return 'Неактивна';
  return 'Закрыта';
}

function parseRangedInt(value: string, min: number, max: number): number | null {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    return null;
  }
  return parsed;
}

function extractApiErrorMessage(error: unknown): string | null {
  if (typeof error !== 'object' || error === null) {
    return null;
  }
  const response = (error as { response?: { data?: { message?: string } } }).response;
  const message = response?.data?.message;
  if (typeof message === 'string' && message.trim().length > 0) {
    return message;
  }
  return null;
}

export default function Settings() {
  const [showAddShipyard, setShowAddShipyard] = useState(false);
  const [newShipyardName, setNewShipyardName] = useState('');
  const [newShipyardCity, setNewShipyardCity] = useState('');
  const [newShipyardStreet, setNewShipyardStreet] = useState('');
  const [newShipyardPostalCode, setNewShipyardPostalCode] = useState('');
  const [editingShipyardId, setEditingShipyardId] = useState<number | null>(null);
  const [editShipyardName, setEditShipyardName] = useState('');
  const [editShipyardCity, setEditShipyardCity] = useState('');
  const [editShipyardStreet, setEditShipyardStreet] = useState('');
  const [editShipyardPostalCode, setEditShipyardPostalCode] = useState('');

  const [showAddDock, setShowAddDock] = useState(false);
  const [newDockName, setNewDockName] = useState('');
  const [newDockLength, setNewDockLength] = useState('150');
  const [newDockWidth, setNewDockWidth] = useState('30');
  const [newDockDraft, setNewDockDraft] = useState('10');
  const [newDockShipyardId, setNewDockShipyardId] = useState('');
  const [editingDockId, setEditingDockId] = useState<number | null>(null);
  const [editDockName, setEditDockName] = useState('');
  const [editDockLength, setEditDockLength] = useState('');
  const [editDockWidth, setEditDockWidth] = useState('');
  const [editDockDraft, setEditDockDraft] = useState('');
  const [editDockShipyardId, setEditDockShipyardId] = useState('');

  const [docks, setDocks] = useState<Dock[]>([]);
  const [shipyards, setShipyards] = useState<Shipyard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeShipyards = useMemo(
    () => shipyards.filter((shipyard) => shipyard.status === 'ACTIVE'),
    [shipyards]
  );

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [docksData, shipyardsData] = await Promise.all([getDocks(), getShipyards()]);
      setDocks(docksData);
      setShipyards(shipyardsData);
      const defaultShipyard = shipyardsData.find((item) => item.status === 'ACTIVE') ?? shipyardsData[0];
      if (!newDockShipyardId && defaultShipyard) {
        setNewDockShipyardId(String(defaultShipyard.id));
      }
    } catch {
      setError('Не удалось загрузить управление инфраструктурой.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const resetAddShipyardForm = () => {
    setNewShipyardName('');
    setNewShipyardCity('');
    setNewShipyardStreet('');
    setNewShipyardPostalCode('');
  };

  const resetAddDockForm = () => {
    setNewDockName('');
    setNewDockLength('150');
    setNewDockWidth('30');
    setNewDockDraft('10');
    const defaultShipyard = activeShipyards[0] ?? shipyards[0];
    setNewDockShipyardId(defaultShipyard ? String(defaultShipyard.id) : '');
  };

  const handleAddShipyard = async () => {
    if (!newShipyardName.trim()) {
      setError('Введите название верфи.');
      return;
    }
    if (!newShipyardCity.trim() || !newShipyardStreet.trim() || !newShipyardPostalCode.trim()) {
      setError('Заполните адрес верфи: город, улица и индекс.');
      return;
    }

    try {
      await createShipyard({
        name: newShipyardName.trim(),
        status: 'ACTIVE',
        shipyardAddress: {
          city: newShipyardCity.trim(),
          street: newShipyardStreet.trim(),
          postalCode: newShipyardPostalCode.trim(),
        },
      });
      setShowAddShipyard(false);
      resetAddShipyardForm();
      await loadData();
    } catch (err) {
      setError(extractApiErrorMessage(err) ?? 'Не удалось создать верфь.');
    }
  };

  const startEditShipyard = (shipyard: Shipyard) => {
    setEditingShipyardId(shipyard.id);
    setEditShipyardName(shipyard.name);
    setEditShipyardCity(shipyard.shipyardAddress.city);
    setEditShipyardStreet(shipyard.shipyardAddress.street);
    setEditShipyardPostalCode(shipyard.shipyardAddress.postalCode);
    setError(null);
  };

  const cancelEditShipyard = () => {
    setEditingShipyardId(null);
    setEditShipyardName('');
    setEditShipyardCity('');
    setEditShipyardStreet('');
    setEditShipyardPostalCode('');
  };

  const saveShipyardChanges = async (shipyardId: number) => {
    const shipyard = shipyards.find((item) => item.id === shipyardId);
    if (!shipyard) {
      setError('Верфь не найдена для редактирования.');
      return;
    }
    if (!editShipyardName.trim()) {
      setError('Название верфи не может быть пустым.');
      return;
    }
    if (!editShipyardCity.trim() || !editShipyardStreet.trim() || !editShipyardPostalCode.trim()) {
      setError('Заполните адрес верфи: город, улица и индекс.');
      return;
    }

    try {
      await updateShipyard(shipyardId, {
        name: editShipyardName.trim(),
        status: shipyard.status,
        shipyardAddress: {
          city: editShipyardCity.trim(),
          street: editShipyardStreet.trim(),
          postalCode: editShipyardPostalCode.trim(),
        },
      });
      cancelEditShipyard();
      await loadData();
    } catch (err) {
      setError(extractApiErrorMessage(err) ?? 'Не удалось сохранить изменения верфи.');
    }
  };

  const handleToggleShipyardStatus = async (shipyard: Shipyard) => {
    const nextStatus: ShipyardStatus = shipyard.status === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE';
    if (
      shipyard.status === 'ACTIVE' &&
      !window.confirm(`Деактивировать верфь «${shipyard.name}»? Новые доки нельзя будет привязать, пока верфь не активна.`)
    ) {
      return;
    }
    try {
      await updateShipyardStatus(shipyard.id, nextStatus);
      await loadData();
    } catch (err) {
      setError(extractApiErrorMessage(err) ?? `Не удалось изменить статус верфи ${shipyard.name}.`);
    }
  };

  const handleAddDock = async () => {
    if (!newDockName.trim()) {
      setError('Введите название дока.');
      return;
    }

    const length = parseRangedInt(newDockLength, LENGTH_MIN, LENGTH_MAX);
    const width = parseRangedInt(newDockWidth, WIDTH_MIN, WIDTH_MAX);
    const draft = parseRangedInt(newDockDraft, DRAFT_MIN, DRAFT_MAX);
    const shipyardId = Number.parseInt(newDockShipyardId, 10);

    if (length == null || width == null || draft == null) {
      setError('Проверьте характеристики дока: длина 1-500, ширина 1-100, осадка 1-30.');
      return;
    }
    if (!Number.isFinite(shipyardId) || shipyardId <= 0) {
      setError('Выберите верфь для дока.');
      return;
    }

    try {
      await createDock({
        name: newDockName.trim(),
        length,
        width,
        draft,
        status: 'active',
        shipyardId,
      });
      setShowAddDock(false);
      resetAddDockForm();
      await loadData();
    } catch (err) {
      setError(extractApiErrorMessage(err) ?? 'Не удалось создать док.');
    }
  };

  const handleDeleteDock = async (dockId: number) => {
    try {
      await deleteDock(dockId);
      setDocks((prev) => prev.filter((dock) => dock.id !== dockId));
    } catch (err) {
      setError(extractApiErrorMessage(err) ?? 'Не удалось удалить док.');
    }
  };

  const handleToggleDockStatus = async (dock: Dock) => {
    if (!dock.shipyardId) {
      setError(`Не удалось изменить статус ${dock.name}: отсутствует shipyardId.`);
      return;
    }
    const nextStatus: Dock['status'] = dock.status === 'active' ? 'inactive' : 'active';
    if (
      dock.status === 'active' &&
      !window.confirm(`Деактивировать док «${dock.name}»?`)) {
      return;
    }
    try {
      await updateDock(dock.id, {
        status: nextStatus,
        shipyardId: dock.shipyardId,
      });
      await loadData();
    } catch (err) {
      setError(extractApiErrorMessage(err) ?? `Не удалось изменить статус ${dock.name}.`);
    }
  };

  const startEditDock = (dock: Dock) => {
    setEditingDockId(dock.id);
    setEditDockName(dock.name);
    setEditDockLength(String(dock.length));
    setEditDockWidth(String(dock.width));
    setEditDockDraft(String(dock.draft));
    setEditDockShipyardId(dock.shipyardId ? String(dock.shipyardId) : '');
    setError(null);
  };

  const cancelEditDock = () => {
    setEditingDockId(null);
    setEditDockName('');
    setEditDockLength('');
    setEditDockWidth('');
    setEditDockDraft('');
    setEditDockShipyardId('');
  };

  const saveDockChanges = async (dockId: number) => {
    if (!editDockName.trim()) {
      setError('Название дока не может быть пустым.');
      return;
    }

    const length = parseRangedInt(editDockLength, LENGTH_MIN, LENGTH_MAX);
    const width = parseRangedInt(editDockWidth, WIDTH_MIN, WIDTH_MAX);
    const draft = parseRangedInt(editDockDraft, DRAFT_MIN, DRAFT_MAX);
    const shipyardId = Number.parseInt(editDockShipyardId, 10);
    const dock = docks.find((item) => item.id === dockId);

    if (length == null || width == null || draft == null) {
      setError('Проверьте характеристики дока: длина 1-500, ширина 1-100, осадка 1-30.');
      return;
    }
    if (!Number.isFinite(shipyardId) || shipyardId <= 0) {
      setError('Выберите верфь для дока.');
      return;
    }
    if (!dock) {
      setError('Док не найден для редактирования.');
      return;
    }

    try {
      await updateDock(dockId, {
        name: editDockName.trim(),
        length,
        width,
        draft,
        status: dock.status,
        shipyardId,
      });
      cancelEditDock();
      await loadData();
    } catch (err) {
      setError(extractApiErrorMessage(err) ?? 'Не удалось сохранить изменения дока.');
    }
  };

  return (
    <div className="space-y-6">
      <V7PageHeader
        title="Управление верфями и доками"
        description="Инфраструктурные настройки: верфи, доки и их характеристики."
      />

      {error && (
        <div className="px-4 py-3 rounded-lg border bg-[var(--danger-bg)] border-[var(--danger-line)] text-[var(--danger-ink)]">
          {error}
        </div>
      )}

      <V7Panel>
        <div className="flex items-center justify-between mb-4 gap-3">
          <V7PanelTitle title="Управление верфями" />
          <Button size="sm" onClick={() => setShowAddShipyard(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Добавить верфь
          </Button>
        </div>

        {showAddShipyard && (
          <div className="mb-4 p-4 bg-[var(--soft)] border border-[var(--line)] rounded-lg space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-[var(--muted)]">Название верфи</span>
                <input
                  type="text"
                  value={newShipyardName}
                  onChange={(e) => setNewShipyardName(e.target.value)}
                  placeholder="Например: Южная верфь"
                  className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)]"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-[var(--muted)]">Город</span>
                <input
                  type="text"
                  value={newShipyardCity}
                  onChange={(e) => setNewShipyardCity(e.target.value)}
                  placeholder="Владивосток"
                  className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)]"
                />
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-[var(--muted)]">Улица</span>
                <input
                  type="text"
                  value={newShipyardStreet}
                  onChange={(e) => setNewShipyardStreet(e.target.value)}
                  placeholder="Портовая 1"
                  className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)]"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-[var(--muted)]">Почтовый индекс</span>
                <input
                  type="text"
                  value={newShipyardPostalCode}
                  onChange={(e) => setNewShipyardPostalCode(e.target.value)}
                  placeholder="690000"
                  className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)]"
                />
              </label>
            </div>
            <div className="text-xs text-[var(--muted)]">Новая верфь создается в статусе «Активна».</div>
            <div className="flex gap-2">
              <Button onClick={handleAddShipyard}>Создать</Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowAddShipyard(false);
                  resetAddShipyardForm();
                }}
              >
                Отмена
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {isLoading ? (
            <div className="text-[var(--muted)] text-center py-4">Загрузка...</div>
          ) : shipyards.length === 0 ? (
            <div className="text-[var(--muted)] text-center py-4">Верфи пока не добавлены.</div>
          ) : (
            shipyards.map((shipyard) => (
              <div key={shipyard.id} className="p-4 border border-[var(--line)] rounded-lg">
                {editingShipyardId === shipyard.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-[var(--muted)]">Название верфи</span>
                        <input
                          type="text"
                          value={editShipyardName}
                          onChange={(e) => setEditShipyardName(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)]"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-[var(--muted)]">Город</span>
                        <input
                          type="text"
                          value={editShipyardCity}
                          onChange={(e) => setEditShipyardCity(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)]"
                        />
                      </label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-[var(--muted)]">Улица</span>
                        <input
                          type="text"
                          value={editShipyardStreet}
                          onChange={(e) => setEditShipyardStreet(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)]"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-[var(--muted)]">Почтовый индекс</span>
                        <input
                          type="text"
                          value={editShipyardPostalCode}
                          onChange={(e) => setEditShipyardPostalCode(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)]"
                        />
                      </label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => void saveShipyardChanges(shipyard.id)}>
                        Сохранить
                      </Button>
                      <Button size="sm" variant="secondary" onClick={cancelEditShipyard}>
                        Отмена
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium">{shipyard.name}</div>
                      <div className="text-sm text-[var(--muted)]">
                        {shipyard.shipyardAddress.city}, {shipyard.shipyardAddress.street},{' '}
                        {shipyard.shipyardAddress.postalCode}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <span className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-lg border border-[var(--line)] bg-[var(--soft)] text-[var(--ink)]">
                        {getShipyardStatusLabel(shipyard.status)}
                      </span>
                      <Button size="sm" variant="outline" onClick={() => void handleToggleShipyardStatus(shipyard)}>
                        {shipyard.status === 'ACTIVE' ? 'Деактивировать' : 'Активировать'}
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => startEditShipyard(shipyard)}>
                        <Pencil className="h-4 w-4 mr-1" />
                        Редактировать
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </V7Panel>

      <V7Panel>
        <div className="flex items-center justify-between mb-4 gap-3">
          <V7PanelTitle title="Управление доками" />
          <Button size="sm" onClick={() => setShowAddDock(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Добавить док
          </Button>
        </div>

        {showAddDock && (
          <div className="mb-4 p-4 bg-[var(--soft)] border border-[var(--line)] rounded-lg space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-[var(--muted)]">Название дока</span>
                <input
                  type="text"
                  value={newDockName}
                  onChange={(e) => setNewDockName(e.target.value)}
                  placeholder="Например: Док-4"
                  className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)]"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-[var(--muted)]">Верфь (только активные)</span>
                <select
                  value={newDockShipyardId}
                  onChange={(e) => setNewDockShipyardId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)]"
                >
                  {activeShipyards.length === 0 ? (
                    <option value="">Нет активных верфей</option>
                  ) : (
                    activeShipyards.map((shipyard) => (
                      <option key={shipyard.id} value={shipyard.id}>
                        {shipyard.name}
                      </option>
                    ))
                  )}
                </select>
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-[var(--muted)]">Макс. длина, м</span>
                <input
                  type="number"
                  min={LENGTH_MIN}
                  max={LENGTH_MAX}
                  value={newDockLength}
                  onChange={(e) => setNewDockLength(e.target.value)}
                  placeholder="280"
                  className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)]"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-[var(--muted)]">Макс. ширина, м</span>
                <input
                  type="number"
                  min={WIDTH_MIN}
                  max={WIDTH_MAX}
                  value={newDockWidth}
                  onChange={(e) => setNewDockWidth(e.target.value)}
                  placeholder="45"
                  className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)]"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-[var(--muted)]">Макс. осадка, м</span>
                <input
                  type="number"
                  min={DRAFT_MIN}
                  max={DRAFT_MAX}
                  value={newDockDraft}
                  onChange={(e) => setNewDockDraft(e.target.value)}
                  placeholder="12"
                  className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)]"
                />
              </label>
            </div>
            <div className="text-xs text-[var(--muted)]">
              Допустимые диапазоны: длина 1-500 м, ширина 1-100 м, осадка 1-30 м.
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddDock} disabled={activeShipyards.length === 0 || !newDockShipyardId}>
                Создать
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowAddDock(false);
                  resetAddDockForm();
                }}
              >
                Отмена
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {isLoading ? (
            <div className="text-[var(--muted)] text-center py-4">Загрузка...</div>
          ) : docks.length === 0 ? (
            <div className="text-[var(--muted)] text-center py-4">Доки пока не добавлены.</div>
          ) : (
            docks.map((dock) => (
              <div key={dock.id} className="p-4 border border-[var(--line)] rounded-lg">
                {editingDockId === dock.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-[var(--muted)]">Название дока</span>
                        <input
                          type="text"
                          value={editDockName}
                          onChange={(e) => setEditDockName(e.target.value)}
                          placeholder="Например: Док-1"
                          className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)]"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-[var(--muted)]">Верфь</span>
                        <select
                          value={editDockShipyardId}
                          onChange={(e) => setEditDockShipyardId(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)]"
                        >
                          {activeShipyards.length === 0 ? (
                            <option value="">Нет активных верфей</option>
                          ) : (
                            activeShipyards.map((shipyard) => (
                              <option key={shipyard.id} value={shipyard.id}>
                                {shipyard.name}
                              </option>
                            ))
                          )}
                        </select>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-[var(--muted)]">Макс. длина, м</span>
                        <input
                          type="number"
                          min={LENGTH_MIN}
                          max={LENGTH_MAX}
                          value={editDockLength}
                          onChange={(e) => setEditDockLength(e.target.value)}
                          placeholder="280"
                          className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)]"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-[var(--muted)]">Макс. ширина, м</span>
                        <input
                          type="number"
                          min={WIDTH_MIN}
                          max={WIDTH_MAX}
                          value={editDockWidth}
                          onChange={(e) => setEditDockWidth(e.target.value)}
                          placeholder="45"
                          className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)]"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-[var(--muted)]">Макс. осадка, м</span>
                        <input
                          type="number"
                          min={DRAFT_MIN}
                          max={DRAFT_MAX}
                          value={editDockDraft}
                          onChange={(e) => setEditDockDraft(e.target.value)}
                          placeholder="12"
                          className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)]"
                        />
                      </label>
                    </div>
                    <div className="text-xs text-[var(--muted)]">
                      Диапазоны: длина 1-500 м, ширина 1-100 м, осадка 1-30 м.
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => void saveDockChanges(dock.id)}>
                        Сохранить
                      </Button>
                      <Button size="sm" variant="secondary" onClick={cancelEditDock}>
                        Отмена
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium">{dock.name}</div>
                      <div className="text-sm text-[var(--muted)]">
                        Длина: {dock.length} м • Ширина: {dock.width} м • Осадка: {dock.draft} м
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <span className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-lg border border-[var(--line)] bg-[var(--soft)] text-[var(--ink)]">
                        {getDockStatusLabel(dock.status)}
                      </span>
                      <Button size="sm" variant="outline" onClick={() => void handleToggleDockStatus(dock)}>
                        {dock.status === 'active' ? 'Деактивировать' : 'Активировать'}
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => startEditDock(dock)}>
                        <Pencil className="h-4 w-4 mr-1" />
                        Редактировать
                      </Button>
                      <button
                        className="text-[var(--muted)] hover:text-[var(--ink)]"
                        onClick={() => void handleDeleteDock(dock.id)}
                        aria-label={`Удалить док ${dock.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </V7Panel>
    </div>
  );
}
