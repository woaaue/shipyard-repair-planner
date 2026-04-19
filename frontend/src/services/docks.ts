import api from './api';

export interface Dock {
  id: number;
  name: string;
  length: number;
  capacity: number;
  status: 'active' | 'maintenance' | 'inactive';
}

type BackendDockStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'REPAIR';

interface BackendDockResponse {
  id: number;
  name: string;
  dimensions: {
    maxLength: number;
    maxWidth: number;
    maxDraft: number;
  };
  status: BackendDockStatus;
}

interface BackendCreateDockRequest {
  name: string;
  dimensions: {
    maxLength: number;
    maxWidth: number;
    maxDraft: number;
  };
  status: BackendDockStatus;
  shipyardId: number;
}

const statusToUi: Record<BackendDockStatus, Dock['status']> = {
  AVAILABLE: 'active',
  OCCUPIED: 'active',
  MAINTENANCE: 'maintenance',
  REPAIR: 'inactive',
};

const uiToStatus: Record<Dock['status'], BackendDockStatus> = {
  active: 'AVAILABLE',
  maintenance: 'MAINTENANCE',
  inactive: 'REPAIR',
};

function mapBackendToUiDock(dock: BackendDockResponse): Dock {
  return {
    id: dock.id,
    name: dock.name,
    length: dock.dimensions?.maxLength ?? 0,
    capacity: Math.round((dock.dimensions?.maxLength ?? 0) * (dock.dimensions?.maxWidth ?? 0)),
    status: statusToUi[dock.status] ?? 'active',
  };
}

function mapUiToBackendDock(data: Omit<Dock, 'id'>): BackendCreateDockRequest {
  return {
    name: data.name,
    dimensions: {
      maxLength: data.length,
      maxWidth: Math.max(1, Math.round(data.capacity / Math.max(data.length, 1))),
      maxDraft: 10,
    },
    status: uiToStatus[data.status] ?? 'AVAILABLE',
    shipyardId: 1,
  };
}

export const getDocks = async (): Promise<Dock[]> => {
  const response = await api.get<BackendDockResponse[]>('/docks');
  return response.data.map(mapBackendToUiDock);
};

export const getDock = async (id: number): Promise<Dock> => {
  const response = await api.get<BackendDockResponse>(`/docks/${id}`);
  return mapBackendToUiDock(response.data);
};

export const createDock = async (data: Omit<Dock, 'id'>): Promise<Dock> => {
  const response = await api.post<BackendDockResponse>('/docks', mapUiToBackendDock(data));
  return mapBackendToUiDock(response.data);
};

export const updateDock = async (_id: number, _data: Partial<Dock>): Promise<Dock> => {
  throw new Error('Dock update endpoint is not implemented on backend yet');
};

export const deleteDock = async (id: number): Promise<void> => {
  await api.delete(`/docks/${id}`);
};

export const getDockSchedule = async (): Promise<never[]> => {
  return [];
};

export const getDockLoad = async (): Promise<number> => {
  return 0;
};
