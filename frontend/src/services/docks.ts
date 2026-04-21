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

interface BackendDockScheduleItem {
  repairId: number;
  repairRequestId: number;
  shipName: string;
  status: string;
  startDate: string;
  endDate: string;
  progressPercentage: number;
}

interface BackendDockUpdateRequest {
  name: string;
  dimensions: {
    maxLength: number;
    maxWidth: number;
    maxDraft: number;
  };
  status: BackendDockStatus;
  shipyardId: number;
}

export interface DockScheduleItem {
  repairId: number;
  repairRequestId: number;
  shipName: string;
  status: string;
  startDate: string;
  endDate: string;
  progress: number;
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

export const updateDock = async (id: number, data: Partial<Dock>): Promise<Dock> => {
  const currentDock = await getDock(id);
  const merged: Omit<Dock, 'id'> = {
    name: data.name ?? currentDock.name,
    length: data.length ?? currentDock.length,
    capacity: data.capacity ?? currentDock.capacity,
    status: data.status ?? currentDock.status,
  };

  const payload: BackendDockUpdateRequest = {
    ...mapUiToBackendDock(merged),
    shipyardId: 1,
  };

  const response = await api.put<BackendDockResponse>(`/docks/${id}`, payload);
  return mapBackendToUiDock(response.data);
};

export const deleteDock = async (id: number): Promise<void> => {
  await api.delete(`/docks/${id}`);
};

export const getDockSchedule = async (
  id: number,
  startDate?: string,
  endDate?: string
): Promise<DockScheduleItem[]> => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const response = await api.get<BackendDockScheduleItem[]>(`/docks/${id}/schedule`, { params });
  return response.data.map((item) => ({
    repairId: item.repairId,
    repairRequestId: item.repairRequestId,
    shipName: item.shipName,
    status: item.status,
    startDate: item.startDate,
    endDate: item.endDate,
    progress: item.progressPercentage,
  }));
};

export const getDockLoad = async (id: number): Promise<number> => {
  const response = await api.get<number>(`/docks/${id}/load`);
  return response.data;
};
