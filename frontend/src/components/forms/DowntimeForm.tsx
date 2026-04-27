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

    const resolvedDockName = dockName || formData.dockName;
    if (!resolvedDockName) {
      window.alert('Dock name is required.');
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
      window.alert('Failed to create downtime record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Register downtime" icon={AlertCircle}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="bg-yellow-50 p-3 rounded-lg text-sm text-yellow-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          Downtime will be saved in the system and shown to dispatching.
        </div>

        {!dockName && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dock name *</label>
            <input
              type="text"
              value={formData.dockName}
              onChange={(e) => setFormData({ ...formData, dockName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Dock 1"
              required
            />
          </div>
        )}

        {dockName && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dock</label>
            <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-700">{dockName}</div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
          <select
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Start *</label>
            <input
              type="datetime-local"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected end</label>
            <input
              type="datetime-local"
              value={formData.expectedEndDate}
              onChange={(e) => setFormData({ ...formData, expectedEndDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Additional details..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save downtime'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
