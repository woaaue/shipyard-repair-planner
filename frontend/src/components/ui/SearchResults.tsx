import { Ship, Wrench, User, Loader2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { SearchResult } from '../../hooks/useGlobalSearch';

interface SearchResultsProps {
  query: string;
  results: SearchResult[];
  isSearching: boolean;
  onClose?: () => void;
  onSelect?: (type: string, id: number) => void;
}

export default function SearchResults({ query, results, isSearching, onClose, onSelect }: SearchResultsProps) {
  const [selected, setSelected] = useState(0);

  const decoratedResults = useMemo(
    () =>
      results.map((result) => ({
        ...result,
        icon: result.type === 'ship' ? Ship : result.type === 'repair' ? Wrench : User,
      })),
    [results]
  );

  if (!query || query.length < 2) return null;

  if (isSearching) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-lg shadow-lg p-4 text-center text-gray-500 flex items-center justify-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Searching...
      </div>
    );
  }

  if (decoratedResults.length === 0) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-lg shadow-lg p-4 text-center text-gray-500">
        Nothing found
      </div>
    );
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
      <div className="p-2 border-b flex items-center justify-between">
        <span className="text-sm text-gray-500">Found: {decoratedResults.length}</span>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {decoratedResults.map((result, i) => {
        const Icon = result.icon;
        return (
          <button
            key={`${result.type}-${result.id}`}
            className={`w-full p-3 flex items-center gap-3 hover:bg-gray-50 text-left ${i === selected ? 'bg-blue-50' : ''}`}
            onClick={() => onSelect?.(result.type, result.id)}
            onMouseEnter={() => setSelected(i)}
          >
            <Icon className="h-5 w-5 text-gray-400" />
            <div>
              <div className="font-medium">{result.title}</div>
              <div className="text-sm text-gray-500">{result.subtitle}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
