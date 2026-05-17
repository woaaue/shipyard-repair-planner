import api from './api';

export interface Dock {
  id: number;
  name: string;
  length: number;
  width: number;
  draft: number;
  capacity: number;
  status: 'active' | 'inactive';
  shipyardId?: number | null;
}

export interface DockUpsertInput {
  name: string;
  length: number;
  width: number;
  draft: number;
  status: Dock['status'];
  shipyardId: number;
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
  shipyardId?: number | null;
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
  MAINTENANCE: 'inactive',
  REPAIR: 'inactive',
};

const uiToStatus: Record<Dock['status'], BackendDockStatus> = {
  active: 'AVAILABLE',
  inactive: 'REPAIR',
};

function mapBackendToUiDock(dock: BackendDockResponse): Dock {
  const maxLength = dock.dimensions?.maxLength ?? 0;
  const maxWidth = dock.dimensions?.maxWidth ?? 0;
  const maxDraft = dock.dimensions?.maxDraft ?? 0;
  return {
    id: dock.id,
    name: dock.name,
    length: maxLength,
    width: maxWidth,
    draft: maxDraft,
    capacity: Math.round(maxLength * maxWidth),
    status: statusToUi[dock.status] ?? 'active',
    shipyardId: dock.shipyardId ?? null,
  };
}

function mapUiToBackendDock(data: DockUpsertInput): BackendCreateDockRequest {
  return {
    name: data.name,
    dimensions: {
      maxLength: data.length,
      maxWidth: data.width,
      maxDraft: data.draft,
    },
    status: uiToStatus[data.status] ?? 'AVAILABLE',
    shipyardId: data.shipyardId,
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

export const createDock = async (data: DockUpsertInput): Promise<Dock> => {
  const response = await api.post<BackendDockResponse>('/docks', mapUiToBackendDock(data));
  return mapBackendToUiDock(response.data);
};

export const updateDock = async (id: number, data: Partial<DockUpsertInput>): Promise<Dock> => {
  if (data.shipyardId == null) {
    throw new Error('shipyardId is required for dock update');
  }

  const currentDock = await getDock(id);
  const merged: DockUpsertInput = {
    name: data.name ?? currentDock.name,
    length: data.length ?? currentDock.length,
    width: data.width ?? currentDock.width,
    draft: data.draft ?? currentDock.draft,
    status: data.status ?? currentDock.status,
    shipyardId: data.shipyardId,
  };

  const payload: BackendDockUpdateRequest = mapUiToBackendDock(merged);

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
