import api from './api';

export type WorkCategory =
  | 'HULL'
  | 'MECHANICAL'
  | 'ELECTRICAL'
  | 'PAINTING'
  | 'PIPING'
  | 'VALVES'
  | 'PROPULSION'
  | 'STEEL'
  | 'TANKS'
  | 'SAFETY'
  | 'OTHER';

export type WorkItemStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface WorkItemResponse {
  id: number;
  repairRequestId: number;
  repairId: number | null;
  category: WorkCategory;
  name: string;
  description: string | null;
  status: WorkItemStatus;
  estimatedHours: number;
  actualHours: number;
  isMandatory: boolean;
  isDiscovered: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkItemPayload {
  repairRequestId: number;
  repairId?: number | null;
  category: WorkCategory;
  name: string;
  description?: string | null;
  status?: WorkItemStatus;
  estimatedHours?: number;
  actualHours?: number;
  isMandatory?: boolean;
  isDiscovered?: boolean;
  notes?: string | null;
}

export const getWorkItems = async (filters?: {
  repairRequestId?: number;
  repairId?: number;
  category?: WorkCategory;
  status?: WorkItemStatus;
}): Promise<WorkItemResponse[]> => {
  const params = new URLSearchParams();
  if (typeof filters?.repairRequestId === 'number') params.append('repairRequestId', String(filters.repairRequestId));
  if (typeof filters?.repairId === 'number') params.append('repairId', String(filters.repairId));
  if (filters?.category) params.append('category', filters.category);
  if (filters?.status) params.append('status', filters.status);

  const response = await api.get<WorkItemResponse[]>('/work-items', { params });
  return response.data;
};

export const getWorkItem = async (id: number): Promise<WorkItemResponse> => {
  const response = await api.get<WorkItemResponse>(`/work-items/${id}`);
  return response.data;
};

export const createWorkItem = async (payload: WorkItemPayload): Promise<WorkItemResponse> => {
  const response = await api.post<WorkItemResponse>('/work-items', payload);
  return response.data;
};

export const updateWorkItem = async (id: number, payload: WorkItemPayload): Promise<WorkItemResponse> => {
  const response = await api.put<WorkItemResponse>(`/work-items/${id}`, payload);
  return response.data;
};

export const updateWorkItemStatus = async (
  id: number,
  status: WorkItemStatus
): Promise<WorkItemResponse> => {
  const response = await api.patch<WorkItemResponse>(`/work-items/${id}/status`, { status });
  return response.data;
};

export const deleteWorkItem = async (id: number): Promise<void> => {
  await api.delete(`/work-items/${id}`);
};
