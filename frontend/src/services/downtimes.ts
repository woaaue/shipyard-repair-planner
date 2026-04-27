import api from './api';

export interface DowntimeResponse {
  id: number;
  dockName: string;
  reason: string;
  startDate: string;
  endDate: string | null;
  expectedEndDate: string | null;
  notes: string | null;
  createdAt: string;
}

export interface CreateDowntimePayload {
  dockName: string;
  reason: string;
  startDate: string;
  expectedEndDate?: string;
  notes?: string;
}

export const getDowntimes = async (filters?: {
  dockName?: string;
  activeOnly?: boolean;
}): Promise<DowntimeResponse[]> => {
  const params = new URLSearchParams();
  if (filters?.dockName) params.append('dockName', filters.dockName);
  if (typeof filters?.activeOnly === 'boolean') params.append('activeOnly', String(filters.activeOnly));

  const response = await api.get<DowntimeResponse[]>('/downtimes', { params });
  return response.data;
};

export const createDowntime = async (payload: CreateDowntimePayload): Promise<DowntimeResponse> => {
  const response = await api.post<DowntimeResponse>('/downtimes', payload);
  return response.data;
};

export const finishDowntime = async (id: number, endDate?: string): Promise<DowntimeResponse> => {
  const payload = endDate ? { endDate } : {};
  const response = await api.patch<DowntimeResponse>(`/downtimes/${id}/finish`, payload);
  return response.data;
};
