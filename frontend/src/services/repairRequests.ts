import api from './api';

export type RepairRequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface RepairRequestResponse {
  id: number;
  shipId: number;
  shipName: string;
  clientId: number;
  clientName: string;
  status: RepairRequestStatus;
  requestedStartDate: string | null;
  requestedEndDate: string | null;
  scheduledStartDate: string | null;
  scheduledEndDate: string | null;
  estimatedDurationDays: number;
  contingencyDays: number;
  actualDurationDays: number;
  totalCost: number | null;
  description: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRepairRequestPayload {
  shipId: number;
  clientId: number;
  requestedStartDate?: string | null;
  requestedEndDate?: string | null;
  scheduledStartDate?: string | null;
  scheduledEndDate?: string | null;
  estimatedDurationDays?: number;
  contingencyDays?: number;
  actualDurationDays?: number;
  totalCost?: number | null;
  description?: string | null;
  notes?: string | null;
  status?: RepairRequestStatus;
}

export const getRepairRequests = async (filters?: {
  clientId?: number;
  shipId?: number;
  status?: RepairRequestStatus;
}): Promise<RepairRequestResponse[]> => {
  const params = new URLSearchParams();
  if (typeof filters?.clientId === 'number') params.append('clientId', String(filters.clientId));
  if (typeof filters?.shipId === 'number') params.append('shipId', String(filters.shipId));
  if (filters?.status) params.append('status', filters.status);

  const response = await api.get<RepairRequestResponse[]>('/repair-requests', { params });
  return response.data;
};

export const getRepairRequest = async (id: number): Promise<RepairRequestResponse> => {
  const response = await api.get<RepairRequestResponse>(`/repair-requests/${id}`);
  return response.data;
};

export const createRepairRequest = async (
  payload: CreateRepairRequestPayload
): Promise<RepairRequestResponse> => {
  const response = await api.post<RepairRequestResponse>('/repair-requests', payload);
  return response.data;
};

export const updateRepairRequest = async (
  id: number,
  payload: CreateRepairRequestPayload
): Promise<RepairRequestResponse> => {
  const response = await api.put<RepairRequestResponse>(`/repair-requests/${id}`, payload);
  return response.data;
};

export const updateRepairRequestStatus = async (
  id: number,
  status: RepairRequestStatus
): Promise<RepairRequestResponse> => {
  const response = await api.patch<RepairRequestResponse>(`/repair-requests/${id}/status`, { status });
  return response.data;
};

export const deleteRepairRequest = async (id: number): Promise<void> => {
  await api.delete(`/repair-requests/${id}`);
};
