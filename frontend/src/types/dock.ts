export interface Dock {
  id: number;
  name: string;
  length: number;
  capacity: number;
  status: 'active' | 'maintenance' | 'inactive';
  load: number;
}

export interface DockFilters {
  search: string;
  status: string;
}

export interface RepairFilters {
  search: string;
  status: string;
  dock: string;
  repairType: string;
  priority: string;
}
