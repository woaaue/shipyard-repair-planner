import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { createDowntime, type DowntimeResponse } from '../../services/downtimes';

interface DowntimeFormProps {
  onClose: () => void;
  onSubmit?: (data: DowntimeResponse) => void | Promise<void>;
  dockName?: string;
}

const DOWNTIME_REASONS = [
  'Weather conditions',
  'Materials unavailable',
  'Technical breakdown',
  'Staff shortage',
  'Planned maintenance',
  'Waiting for vessel',
  'Other',
] as const;

export default function DowntimeForm({ onClose, onSubmit, dockName }: DowntimeFormProps) {
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    dockName: dockName || '',
    reason: DOWNTIME_REASONS[0] as string,
    startDate: '',
    expectedEndDate: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const resolvedDockName = dockName || formData.dockName;
    if (!resolvedDockName) {
      setError('Укажите док.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createDowntime({
        dockName: resolvedDockName,
        reason: formData.reason,
        startDate: formData.startDate,
        expectedEndDate: formData.expectedEndDate || undefined,
        notes: formData.notes || undefined,
      });

      if (onSubmit) {
        await onSubmit(created);
      }
      onClose();
    } catch {
      setError('Не удалось зарегистрировать простой.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Регистрация простоя" icon={AlertCircle} bodyClassName="p-0">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="bg-[var(--soft)] border border-[var(--line)] p-3 rounded-lg text-sm text-[var(--ink)] flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-[var(--muted)]" />
          Простой будет сохранен в системе и виден диспетчеру.
        </div>
        {error && (
          <div className="px-4 py-3 rounded-lg border bg-[var(--danger-bg)] border-[var(--danger-line)] text-[var(--danger-ink)] text-sm">
            {error}
          </div>
        )}

        {!dockName && (
          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-1">Док *</label>
            <input
              type="text"
              value={formData.dockName}
              onChange={(e) => setFormData({ ...formData, dockName: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
              placeholder="Док 1"
              required
            />
          </div>
        )}

        {dockName && (
          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-1">Док</label>
            <div className="px-3 py-2 bg-[var(--soft)] border border-[var(--line)] rounded-lg text-[var(--ink)]">{dockName}</div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-[var(--muted)] mb-1">Причина *</label>
          <select
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
            required
          >
            {DOWNTIME_REASONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-1">Начало *</label>
            <input
              type="datetime-local"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-1">Ожидаемое завершение</label>
            <input
              type="datetime-local"
              value={formData.expectedEndDate}
              onChange={(e) => setFormData({ ...formData, expectedEndDate: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--muted)] mb-1">Комментарий</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
            placeholder="Дополнительные детали..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--line)]">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Отмена
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
