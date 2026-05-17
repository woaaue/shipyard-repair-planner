import api from './api';
import type { ExtendedRepair } from '../types/repair';

export interface RepairFilters {
  dockId?: number;
  operatorId?: number;
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
  operatorId: number | null;
  operatorFullName: string | null;
  status: BackendRepairStatus;
  actualStartDate: string | null;
  actualEndDate: string | null;
  progressPercentage: number;
  totalCost: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BackendRepairRequestLookup {
  id: number;
  shipName: string;
  requestedStartDate?: string | null;
  requestedEndDate?: string | null;
  scheduledStartDate?: string | null;
  scheduledEndDate?: string | null;
}

const PRIORITY_NOTE_PREFIX = '[priority]:';
const PRIORITY_VALUES: ExtendedRepair['priority'][] = ['низкий', 'средний', 'высокий', 'критический'];

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

function mapBackendToUiRepair(repair: BackendRepairResponse, requestMeta?: BackendRepairRequestLookup): ExtendedRepair {
  const shipName = requestMeta?.shipName?.trim() || `Заявка #${repair.repairRequestId}`;
  const plannedStartDate = requestMeta?.scheduledStartDate ?? requestMeta?.requestedStartDate ?? null;
  const plannedEndDate = requestMeta?.scheduledEndDate ?? requestMeta?.requestedEndDate ?? null;
  const effectiveStartDate = repair.actualStartDate ?? plannedStartDate ?? '';
  const effectiveEndDate = repair.actualEndDate ?? plannedEndDate ?? '';

  return {
    id: repair.id,
    shipId: repair.repairRequestId,
    shipName,
    dock: repair.dockName || `Док #${repair.dockId}`,
    startDate: effectiveStartDate,
    endDate: effectiveEndDate,
    plannedStartDate: plannedStartDate ?? undefined,
    plannedEndDate: plannedEndDate ?? undefined,
    status: statusToUi[repair.status] ?? 'запланирован',
    progress: repair.progressPercentage ?? 0,
    budget: repair.totalCost ?? 0,
    spent: repair.totalCost ?? 0,
    manager: repair.operatorFullName ?? 'Не назначен',
    operatorId: repair.operatorId ?? undefined,
    operatorFullName: repair.operatorFullName ?? undefined,
    repairType: 'Текущий ремонт',
    priority: getPriorityFromNotes(repair.notes),
    actualStartDate: repair.actualStartDate ?? undefined,
    actualEndDate: repair.actualEndDate ?? undefined,
    tasks: [],
  };
}

function getPriorityFromNotes(notes: string | null): ExtendedRepair['priority'] {
  if (!notes) return 'средний';
  const line = notes
    .split(/\r?\n/)
    .map((part) => part.trim())
    .find((part) => part.startsWith(PRIORITY_NOTE_PREFIX));
  if (!line) return 'средний';
  const value = line.slice(PRIORITY_NOTE_PREFIX.length).trim().toLowerCase();
  return PRIORITY_VALUES.includes(value as ExtendedRepair['priority'])
    ? (value as ExtendedRepair['priority'])
    : 'средний';
}

function withPriorityInNotes(
  notes: string | null,
  priority: ExtendedRepair['priority']
): string {
  const cleaned = (notes ?? '')
    .split(/\r?\n/)
    .filter((part) => !part.trim().startsWith(PRIORITY_NOTE_PREFIX))
    .join('\n')
    .trim();

  if (cleaned.length === 0) {
    return `${PRIORITY_NOTE_PREFIX} ${priority}`;
  }

  return `${cleaned}\n${PRIORITY_NOTE_PREFIX} ${priority}`;
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
  if (typeof filters?.operatorId === 'number') params.append('operatorId', String(filters.operatorId));
  if (typeof filters?.repairRequestId === 'number') params.append('repairRequestId', String(filters.repairRequestId));
  if (filters?.status) params.append('status', filters.status);

  const [repairsResponse, requestsResponse] = await Promise.all([
    api.get<BackendRepairResponse[]>('/repairs', { params }),
    api.get<BackendRepairRequestLookup[]>('/repair-requests'),
  ]);

  const requestById = new Map<number, BackendRepairRequestLookup>(
    requestsResponse.data.map((request) => [request.id, request])
  );

  return repairsResponse.data.map((repair) =>
    mapBackendToUiRepair(repair, requestById.get(repair.repairRequestId))
  );
};

export const getRepair = async (id: number): Promise<ExtendedRepair> => {
  const response = await api.get<BackendRepairResponse>(`/repairs/${id}`);
  try {
    const requestResponse = await api.get<BackendRepairRequestLookup>(
      `/repair-requests/${response.data.repairRequestId}`
    );
    return mapBackendToUiRepair(response.data, requestResponse.data);
  } catch {
    return mapBackendToUiRepair(response.data);
  }
};

async function getRepairRaw(id: number): Promise<BackendRepairResponse> {
  const response = await api.get<BackendRepairResponse>(`/repairs/${id}`);
  return response.data;
}

export const createRepair = async (data: Partial<ExtendedRepair>): Promise<ExtendedRepair> => {
  const response = await api.post<BackendRepairResponse>('/repairs', mapUiToBackendRepair(data));
  return getRepair(response.data.id);
};

export const updateRepair = async (id: number, data: Partial<ExtendedRepair>): Promise<ExtendedRepair> => {
  const response = await api.put<BackendRepairResponse>(`/repairs/${id}`, mapUiToBackendRepair(data));
  return getRepair(response.data.id);
};

export const updateRepairStatus = async (id: number, status: BackendRepairStatus): Promise<ExtendedRepair> => {
  const response = await api.patch<BackendRepairResponse>(`/repairs/${id}/status`, { status });
  return getRepair(response.data.id);
};

export const updateRepairPriority = async (
  id: number,
  priority: ExtendedRepair['priority']
): Promise<ExtendedRepair> => {
  const current = await getRepairRaw(id);
  const payload: BackendCreateRepairRequest = {
    repairRequestId: current.repairRequestId,
    dockId: current.dockId,
    status: current.status,
    actualStartDate: current.actualStartDate,
    actualEndDate: current.actualEndDate,
    progressPercentage: current.progressPercentage,
    totalCost: current.totalCost,
    notes: withPriorityInNotes(current.notes, priority),
  };

  const response = await api.put<BackendRepairResponse>(`/repairs/${id}`, payload);
  return getRepair(response.data.id);
};

export const deleteRepair = async (id: number): Promise<void> => {
  await api.delete(`/repairs/${id}`);
};

export const updateRepairOperator = async (
  id: number,
  operatorId: number | null
): Promise<ExtendedRepair> => {
  const response = await api.patch<BackendRepairResponse>(`/repairs/${id}/operator`, { operatorId });
  return getRepair(response.data.id);
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
