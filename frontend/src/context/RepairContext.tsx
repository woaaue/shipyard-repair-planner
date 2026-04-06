import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { ExtendedRepair } from '../types/repair';
import type { RepairFilters } from '../types/dock';
import { useAuth } from './AuthContext';
import { mockExtendedRepairs } from '../mock-data/data';

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
      result = result.filter(r => r.dock === user.dock);
    }

    if (user?.role === 'client' && user.shipId) {
      result = result.filter(r => r.shipId === user.shipId);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(r =>
        r.shipName?.toLowerCase().includes(search) ||
        r.dock.toLowerCase().includes(search) ||
        r.manager.toLowerCase().includes(search) ||
        r.repairType?.toLowerCase().includes(search)
      );
    }

    if (filters.status && filters.status !== '') {
      result = result.filter(r => r.status === filters.status);
    }

    if (filters.dock && filters.dock !== '') {
      result = result.filter(r => r.dock === filters.dock);
    }

    if (filters.repairType && filters.repairType !== '') {
      result = result.filter(r => r.repairType === filters.repairType);
    }

    if (filters.priority && filters.priority !== '') {
      result = result.filter(r => r.priority === filters.priority);
    }

    return result;
  }, [repairs, filters, user]);

  const fetchRepairs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setRepairs(mockExtendedRepairs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки ремонтов');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchRepair = useCallback(async (id: number): Promise<ExtendedRepair | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const repair = repairs.find(r => r.id === id);
      if (!repair) {
        await fetchRepairs();
        return repairs.find(r => r.id === id) || null;
      }
      return repair;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки ремонта');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [repairs, fetchRepairs]);

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

  return (
    <RepairContext.Provider value={value}>
      {children}
    </RepairContext.Provider>
  );
}