import { Ship, Wrench, X } from 'lucide-react';
import { useState } from 'react';
import { mockShips, mockExtendedRepairs } from '../../mock-data/data';

interface SearchResultsProps {
  query: string;
  onClose?: () => void;
  onSelect?: (type: string, id: number) => void;
}

export default function SearchResults({ query, onClose, onSelect }: SearchResultsProps) {
  const [selected, setSelected] = useState(0);
  
  if (!query || query.length < 2) return null;
  
  const ships = mockShips.filter(s => 
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.imo.includes(query)
  );
  
  const repairs = mockExtendedRepairs.filter(r => 
    r.shipName.toLowerCase().includes(query.toLowerCase()) ||
    r.repairType.toLowerCase().includes(query.toLowerCase())
  );
  
  const results = [
    ...ships.map(s => ({ type: 'ship', id: s.id, title: s.name, subtitle: `IMO: ${s.imo}`, icon: Ship })),
    ...repairs.map(r => ({ type: 'repair', id: r.id, title: r.shipName, subtitle: r.repairType, icon: Wrench }))
  ];
  
  if (results.length === 0) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-lg shadow-lg p-4 text-center text-gray-500">
        Ничего не найдено
      </div>
    );
  }
  
  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
      <div className="p-2 border-b flex items-center justify-between">
        <span className="text-sm text-gray-500">Найдено: {results.length}</span>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      
      {results.map((r, i) => {
        const Icon = r.icon;
        return (
          <button
            key={`${r.type}-${r.id}`}
            className={`w-full p-3 flex items-center gap-3 hover:bg-gray-50 text-left ${i === selected ? 'bg-blue-50' : ''}`}
            onClick={() => onSelect?.(r.type, r.id)}
            onMouseEnter={() => setSelected(i)}
          >
            <Icon className="h-5 w-5 text-gray-400" />
            <div>
              <div className="font-medium">{r.title}</div>
              <div className="text-sm text-gray-500">{r.subtitle}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}