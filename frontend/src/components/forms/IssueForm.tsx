import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { createIssue, type IssueResponse } from '../../services/issues';

interface IssueFormProps {
  onClose: () => void;
  onSubmit?: (data: IssueResponse) => void | Promise<void>;
  repairId?: number;
}

const ISSUE_TYPES = [
  'Materials shortage',
  'Defect found',
  'Work delay',
  'Technical malfunction',
  'Staff issue',
  'Other',
] as const;

const ISSUE_IMPACTS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export default function IssueForm({ onClose, onSubmit, repairId }: IssueFormProps) {
  const [formData, setFormData] = useState({
    repairId: repairId ? String(repairId) : '',
    issueType: ISSUE_TYPES[0] as string,
    description: '',
    impact: ISSUE_IMPACTS[0] as string,
    reportedBy: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedRepairId = repairId ?? Number(formData.repairId);
    if (!resolvedRepairId || Number.isNaN(resolvedRepairId)) {
      window.alert('Repair ID is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createIssue({
        repairId: resolvedRepairId,
        issueType: formData.issueType,
        description: formData.description,
        impact: formData.impact,
        reportedBy: formData.reportedBy,
        status: 'OPEN',
      });

      if (onSubmit) {
        await onSubmit(created);
      }
      onClose();
    } catch {
      window.alert('Failed to create issue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Report issue" icon={AlertTriangle}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="bg-orange-50 p-3 rounded-lg text-sm text-orange-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          Describe the issue and it will be visible in the system immediately.
        </div>

        {!repairId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Repair ID *</label>
            <input
              type="number"
              value={formData.repairId}
              onChange={(e) => setFormData({ ...formData, repairId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={1}
              required
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Issue type *</label>
          <select
            value={formData.issueType}
            onChange={(e) => setFormData({ ...formData, issueType: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            {ISSUE_TYPES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Add issue details..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Impact *</label>
          <select
            value={formData.impact}
            onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            {ISSUE_IMPACTS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reported by *</label>
          <input
            type="text"
            value={formData.reportedBy}
            onChange={(e) => setFormData({ ...formData, reportedBy: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Operator name"
            required
          />
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
