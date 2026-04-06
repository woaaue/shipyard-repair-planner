import { useState, useCallback } from 'react';

export interface DockData {
  dockOriginal: string;
  загрузка: number;
  current: number;
  capacity: number;
  status: string;
}

export function useDockSelection() {
  const [selectedDock, setSelectedDock] = useState<DockData | null>(null);
  
  const selectDock = useCallback((dock: DockData) => {
    setSelectedDock(dock);
  }, []);
  
  const clearSelection = useCallback(() => {
    setSelectedDock(null);
  }, []);
  
  return {
    selectedDock,
    selectDock,
    clearSelection,
    isDockSelected: selectedDock !== null
  };
}
