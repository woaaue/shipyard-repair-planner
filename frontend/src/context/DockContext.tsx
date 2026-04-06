import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { Dock, DockFilters } from '../types/dock';
import { useAuth } from './AuthContext';
import { dockNames, mockExtendedRepairs } from '../mock-data/data';

interface DockContextType {
  docks: Dock[];
  filteredDocks: Dock[];
  selectedDock: Dock | null;
  isLoading: boolean;
  error: string | null;
  filters: DockFilters;
  selectDock: (dock: Dock) => void;
  clearSelection: () => void;
  setFilters: (filters: Partial<DockFilters>) => void;
  resetFilters: () => void;
  fetchDocks: () => Promise<void>;
  fetchDock: (id: number) => Promise<Dock | null>;
}

const defaultFilters: DockFilters = {
  search: '',
  status: '',
};

const DockContext = createContext<DockContextType | undefined>(undefined);

export function useDockContext() {
  const context = useContext(DockContext);
  if (!context) {
    throw new Error('useDockContext must be used within DockProvider');
  }
  return context;
}

export function DockProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [docks, setDocks] = useState<Dock[]>([]);
  const [selectedDock, setSelectedDock] = useState<Dock | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<DockFilters>(defaultFilters);

  const selectDock = useCallback((dock: Dock) => {
    setSelectedDock(dock);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedDock(null);
  }, []);

  const setFilters = useCallback((partial: Partial<DockFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters);
  }, []);

  const filteredDocks = useMemo(() => {
    let result = docks;

    if (user?.role === 'operator' && user.dock) {
      result = result.filter(d => d.name === user.dock);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(d => 
        d.name.toLowerCase().includes(search)
      );
    }

    if (filters.status) {
      result = result.filter(d => d.status === filters.status);
    }

    return result;
  }, [docks, filters, user]);

  const fetchDocks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const dockData: Dock[] = dockNames.map((name, index) => {
        const capacityMatch = name.match(/\((\d+)м\)/);
        const length = capacityMatch ? parseInt(capacityMatch[1]) : 100;
        const currentRepairs = mockExtendedRepairs.filter(
          r => r.dock === name && r.status === 'в работе'
        ).length;
        
        return {
          id: index + 1,
          name,
          length,
          capacity: length,
          status: currentRepairs > 0 ? 'active' : 'active',
          load: Math.round((currentRepairs / 3) * 100),
        };
      });
      
      setDocks(dockData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки доков');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchDock = useCallback(async (id: number): Promise<Dock | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const dock = docks.find(d => d.id === id);
      if (!dock) {
        await fetchDocks();
        return docks.find(d => d.id === id) || null;
      }
      return dock;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки дока');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [docks, fetchDocks]);

  const value: DockContextType = {
    docks,
    filteredDocks,
    selectedDock,
    isLoading,
    error,
    filters,
    selectDock,
    clearSelection,
    setFilters,
    resetFilters,
    fetchDocks,
    fetchDock,
  };

  return (
    <DockContext.Provider value={value}>
      {children}
    </DockContext.Provider>
  );
}