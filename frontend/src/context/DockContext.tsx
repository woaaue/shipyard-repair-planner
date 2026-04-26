import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { Dock, DockFilters } from '../types/dock';
import { useAuth } from './AuthContext';
import { getDock, getDocks } from '../services/docks';
import { getRepairs } from '../services/repairs';

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
      result = result.filter((dock) => dock.name === user.dock);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter((dock) => dock.name.toLowerCase().includes(search));
    }

    if (filters.status) {
      result = result.filter((dock) => dock.status === filters.status);
    }

    return result;
  }, [docks, filters, user]);

  const fetchDocks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [dockData, repairs] = await Promise.all([getDocks(), getRepairs()]);
      const activeByDock = new Map<string, number>();

      repairs.forEach((repair) => {
        const isActive = repair.progress > 0 && repair.progress < 100;
        if (!isActive) {
          return;
        }

        activeByDock.set(repair.dock, (activeByDock.get(repair.dock) ?? 0) + 1);
      });

      const withLoad: Dock[] = dockData.map((dock) => {
        const activeRepairs = activeByDock.get(dock.name) ?? 0;
        const assumedCapacity = 3;

        return {
          ...dock,
          load: Math.min(100, Math.round((activeRepairs / assumedCapacity) * 100)),
        };
      });

      setDocks(withLoad);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load docks');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchDock = useCallback(async (id: number): Promise<Dock | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const existing = docks.find((dock) => dock.id === id);
      if (existing) {
        return existing;
      }

      const response = await getDock(id);
      const mapped: Dock = { ...response, load: 0 };
      setDocks((prev) => (prev.some((dock) => dock.id === mapped.id) ? prev : [...prev, mapped]));
      return mapped;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dock');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [docks]);

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

  return <DockContext.Provider value={value}>{children}</DockContext.Provider>;
}
