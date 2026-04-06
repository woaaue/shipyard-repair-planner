import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

interface IssueFormProps {
  onClose: () => void;
  onSubmit?: (data: any) => void;
}

const ISSUE_TYPES = [
  'Нехватка материалов',
  'Обнаружен дефект',
  'Задержка работ',
  'Техническая неисправность',
  'Проблема с персоналом',
  'Другое'
] as const;

export default function IssueForm({ onClose, onSubmit }: IssueFormProps) {
  const [formData, setFormData] = useState({
    issueType: ISSUE_TYPES[0] as string,
    description: '',
    impact: 'минимальный' as string,
    reportedBy: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    }
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Сообщить о проблеме" icon={AlertTriangle}>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="bg-orange-50 p-3 rounded-lg text-sm text-orange-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          Опишите проблему, и мастер участка получит уведомление
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Тип проблемы *</label>
          <select
            value={formData.issueType}
            onChange={(e) => setFormData({ ...formData, issueType: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            {ISSUE_TYPES.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Описание проблемы *</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Подробно опишите проблему..."
            required
          />
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" className="flex-1">
            Отправить
          </Button>
        </div>
      </form>
    </Modal>
  );
}
