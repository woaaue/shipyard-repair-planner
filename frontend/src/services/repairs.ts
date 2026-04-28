import api from './api';
import type { ExtendedRepair } from '../types/repair';

export interface RepairFilters {
  dockId?: number;
  repairRequestId?: number;
  status?: BackendRepairStatus;
}

export type BackendRepairStatus =
  | 'SCHEDULED'
  | 'STARTED'
  | 'IN_PROGRESS'
  | 'QA'
  | 'COMPLETED'
  | 'CANCELLED';

interface BackendRepairResponse {
  id: number;
  repairRequestId: number;
  dockId: number;
  dockName: string;
  status: BackendRepairStatus;
  actualStartDate: string | null;
  actualEndDate: string | null;
  progressPercentage: number;
  totalCost: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BackendCreateRepairRequest {
  repairRequestId: number;
  dockId: number;
  status?: BackendRepairStatus;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  progressPercentage?: number;
  totalCost?: number | null;
  notes?: string | null;
}

interface BackendRepairRequestResponse {
  id: number;
  shipId: number;
  shipName: string;
}

const statusToUi: Record<BackendRepairStatus, ExtendedRepair['status']> = {
  SCHEDULED: 'запланирован',
  STARTED: 'в работе',
  IN_PROGRESS: 'в работе',
  QA: 'в работе',
  COMPLETED: 'завершён',
  CANCELLED: 'отменён',
};

function mapBackendToUiRepair(repair: BackendRepairResponse): ExtendedRepair {
  const defaultDate = new Date().toISOString().slice(0, 10);

  return {
    id: repair.id,
    shipId: repair.repairRequestId,
    shipName: `Repair Request #${repair.repairRequestId}`,
    dock: repair.dockName || `Dock #${repair.dockId}`,
    startDate: repair.actualStartDate ?? defaultDate,
    endDate: repair.actualEndDate ?? defaultDate,
    status: statusToUi[repair.status] ?? 'запланирован',
    progress: repair.progressPercentage ?? 0,
    budget: repair.totalCost ?? 0,
    spent: repair.totalCost ?? 0,
    manager: 'Не назначен',
    repairType: 'Текущий ремонт',
    priority: 'средний',
    actualStartDate: repair.actualStartDate ?? undefined,
    actualEndDate: repair.actualEndDate ?? undefined,
    tasks: [],
  };
}

function mapUiToBackendRepair(data: Partial<ExtendedRepair>): BackendCreateRepairRequest {
  const parsedDockId = Number(data.dock);
  if (!Number.isFinite(parsedDockId) || parsedDockId <= 0) {
    throw new Error('dockId is required and must be a valid number');
  }
  if (!data.shipId) {
    throw new Error('repairRequestId is required');
  }

  return {
    repairRequestId: data.shipId,
    dockId: parsedDockId,
    progressPercentage: data.progress ?? 0,
    totalCost: data.budget ?? 0,
    notes: null,
  };
}

export const getRepairs = async (filters?: RepairFilters): Promise<ExtendedRepair[]> => {
  const params = new URLSearchParams();
  if (typeof filters?.dockId === 'number') params.append('dockId', String(filters.dockId));
  if (typeof filters?.repairRequestId === 'number') params.append('repairRequestId', String(filters.repairRequestId));
  if (filters?.status) params.append('status', filters.status);

  const response = await api.get<BackendRepairResponse[]>('/repairs', { params });
  return response.data.map(mapBackendToUiRepair);
};

export const getRepair = async (id: number): Promise<ExtendedRepair> => {
  const response = await api.get<BackendRepairResponse>(`/repairs/${id}`);
  return mapBackendToUiRepair(response.data);
};

export const createRepair = async (data: Partial<ExtendedRepair>): Promise<ExtendedRepair> => {
  const response = await api.post<BackendRepairResponse>('/repairs', mapUiToBackendRepair(data));
  return mapBackendToUiRepair(response.data);
};

export const updateRepair = async (id: number, data: Partial<ExtendedRepair>): Promise<ExtendedRepair> => {
  const response = await api.put<BackendRepairResponse>(`/repairs/${id}`, mapUiToBackendRepair(data));
  return mapBackendToUiRepair(response.data);
};

export const updateRepairStatus = async (id: number, status: BackendRepairStatus): Promise<ExtendedRepair> => {
  const response = await api.patch<BackendRepairResponse>(`/repairs/${id}/status`, { status });
  return mapBackendToUiRepair(response.data);
};

export const deleteRepair = async (id: number): Promise<void> => {
  await api.delete(`/repairs/${id}`);
};

export const getRepairsByDock = async (dockId: number): Promise<ExtendedRepair[]> => {
  return getRepairs({ dockId });
};

export const getRepairsByShip = async (shipId: number): Promise<ExtendedRepair[]> => {
  const requestsResponse = await api.get<BackendRepairRequestResponse[]>('/repair-requests', {
    params: { shipId },
  });

  const byRequests = await Promise.all(
    requestsResponse.data.map((request) =>
      getRepairs({ repairRequestId: request.id })
    )
  );

  return byRequests.flat();
};
