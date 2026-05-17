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
  const [error, setError] = useState('');
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
    setError('');
    const resolvedRepairId = repairId ?? Number(formData.repairId);
    if (!resolvedRepairId || Number.isNaN(resolvedRepairId)) {
      setError('Укажите ID ремонта.');
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
      setError('Не удалось зарегистрировать проблему.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Проблема по ремонту" icon={AlertTriangle} bodyClassName="p-0">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="bg-[var(--soft)] border border-[var(--line)] p-3 rounded-lg text-sm text-[var(--ink)] flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-[var(--muted)]" />
          Опишите проблему. Она сразу появится в журнале ремонта.
        </div>
        {error && (
          <div className="px-4 py-3 rounded-lg border bg-[var(--danger-bg)] border-[var(--danger-line)] text-[var(--danger-ink)] text-sm">
            {error}
          </div>
        )}

        {!repairId && (
          <div>
            <label className="block text-sm font-medium text-[var(--muted)] mb-1">ID ремонта *</label>
            <input
              type="number"
              value={formData.repairId}
              onChange={(e) => setFormData({ ...formData, repairId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
              min={1}
              required
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-[var(--muted)] mb-1">Тип проблемы *</label>
          <select
            value={formData.issueType}
            onChange={(e) => setFormData({ ...formData, issueType: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
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
          <label className="block text-sm font-medium text-[var(--muted)] mb-1">Описание *</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
            placeholder="Опишите проблему и контекст..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--muted)] mb-1">Влияние *</label>
          <select
            value={formData.impact}
            onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
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
          <label className="block text-sm font-medium text-[var(--muted)] mb-1">Кто сообщил *</label>
          <input
            type="text"
            value={formData.reportedBy}
            onChange={(e) => setFormData({ ...formData, reportedBy: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg border-[var(--line-strong)] bg-white text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
            placeholder="ФИО сотрудника"
            required
          />
        </div>

        <div className="flex gap-3 pt-4 border-t border-[var(--line)]">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose} disabled={isSubmitting}>
            Отмена
          </Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
