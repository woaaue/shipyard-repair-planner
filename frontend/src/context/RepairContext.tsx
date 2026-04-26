import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { ExtendedRepair } from '../types/repair';
import type { RepairFilters } from '../types/dock';
import { useAuth } from './AuthContext';
import { getRepair, getRepairs } from '../services/repairs';

interface RepairContextType {
  repairs: ExtendedRepair[];
  filteredRepairs: ExtendedRepair[];
  selectedRepair: ExtendedRepair | null;
  isLoading: boolean;
  error: string | null;
  filters: RepairFilters;
  selectRepair: (repair: ExtendedRepair) => void;
  clearSelection: () => void;
  setFilters: (filters: Partial<RepairFilters>) => void;
  resetFilters: () => void;
  fetchRepairs: () => Promise<void>;
  fetchRepair: (id: number) => Promise<ExtendedRepair | null>;
}

const defaultFilters: RepairFilters = {
  search: '',
  status: '',
  dock: '',
  repairType: '',
  priority: '',
};

const RepairContext = createContext<RepairContextType | undefined>(undefined);

export function useRepairContext() {
  const context = useContext(RepairContext);
  if (!context) {
    throw new Error('useRepairContext must be used within RepairProvider');
  }
  return context;
}

export function RepairProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [repairs, setRepairs] = useState<ExtendedRepair[]>([]);
  const [selectedRepair, setSelectedRepair] = useState<ExtendedRepair | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<RepairFilters>(defaultFilters);

  const selectRepair = useCallback((repair: ExtendedRepair) => {
    setSelectedRepair(repair);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedRepair(null);
  }, []);

  const setFilters = useCallback((partial: Partial<RepairFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters);
  }, []);

  const filteredRepairs = useMemo(() => {
    let result = repairs;

    if (user?.role === 'operator' && user.dock) {
      result = result.filter((repair) => repair.dock === user.dock);
    }

    if (user?.role === 'client' && user.shipId) {
      result = result.filter((repair) => repair.shipId === user.shipId);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(
        (repair) =>
          repair.shipName?.toLowerCase().includes(search) ||
          repair.dock.toLowerCase().includes(search) ||
          repair.manager.toLowerCase().includes(search) ||
          repair.repairType?.toLowerCase().includes(search)
      );
    }

    if (filters.status) {
      result = result.filter((repair) => repair.status === filters.status);
    }

    if (filters.dock) {
      result = result.filter((repair) => repair.dock === filters.dock);
    }

    if (filters.repairType) {
      result = result.filter((repair) => repair.repairType === filters.repairType);
    }

    if (filters.priority) {
      result = result.filter((repair) => repair.priority === filters.priority);
    }

    return result;
  }, [filters, repairs, user]);

  const fetchRepairs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getRepairs();
      setRepairs(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load repairs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchRepair = useCallback(async (id: number): Promise<ExtendedRepair | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const cached = repairs.find((repair) => repair.id === id);
      if (cached) {
        return cached;
      }

      const response = await getRepair(id);
      setRepairs((prev) => (prev.some((repair) => repair.id === response.id) ? prev : [...prev, response]));
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load repair');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [repairs]);

  const value: RepairContextType = {
    repairs,
    filteredRepairs,
    selectedRepair,
    isLoading,
    error,
    filters,
    selectRepair,
    clearSelection,
    setFilters,
    resetFilters,
    fetchRepairs,
    fetchRepair,
  };

  return <RepairContext.Provider value={value}>{children}</RepairContext.Provider>;
}
