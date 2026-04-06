import { Calendar } from 'lucide-react';
import { useState } from 'react';

interface DateRangePickerProps {
  startDate?: string;
  endDate?: string;
  onChange?: (start: string, end: string) => void;
  placeholder?: string;
}

export default function DateRangePicker({ 
  startDate, 
  endDate, 
  onChange,
  placeholder = 'Выберите период'
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [start, setStart] = useState(startDate || '');
  const [end, setEnd] = useState(endDate || '');
  
  const handleApply = () => {
    onChange?.(start, end);
    setIsOpen(false);
  };
  
  const handleClear = () => {
    setStart('');
    setEnd('');
    onChange?.('', '');
    setIsOpen(false);
  };
  
  const presets = [
    { label: 'За последнюю неделю', days: 7 },
    { label: 'За последний месяц', days: 30 },
    { label: 'За последний квартал', days: 90 },
    { label: 'За последний год', days: 365 }
  ];
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50"
      >
        <Calendar className="h-4 w-4 text-gray-500" />
        <span className="text-sm">
          {start && end 
            ? `${start} - ${end}` 
            : placeholder}
        </span>
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border rounded-lg shadow-lg p-4 z-50 w-80">
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Дата начала</label>
              <input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 mb-1">Дата окончания</label>
              <input
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            
            <div className="pt-2 border-t">
              <p className="text-xs text-gray-500 mb-2">Быстрые периоды:</p>
              <div className="flex flex-wrap gap-2">
                {presets.map(preset => {
                  const today = new Date();
                  const past = new Date(today);
                  past.setDate(past.getDate() - preset.days);
                  
                  return (
                    <button
                      key={preset.days}
                      onClick={() => {
                        setStart(past.toISOString().split('T')[0]);
                        setEnd(today.toISOString().split('T')[0]);
                      }}
                      className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={handleClear}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
              >
                Очистить
              </button>
              <button
                onClick={handleApply}
                className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Применить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}