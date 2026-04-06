import api from './api';

export interface Dock {
  id: number;
  name: string;
  length: number;
  capacity: number;
  status: 'active' | 'maintenance' | 'inactive';
}

export const getDocks = async (): Promise<Dock[]> => {
  const response = await api.get<Dock[]>('/docks');
  return response.data;
};

export const getDock = async (id: number): Promise<Dock> => {
  const response = await api.get<Dock>(`/docks/${id}`);
  return response.data;
};

export const createDock = async (data: Omit<Dock, 'id'>): Promise<Dock> => {
  const response = await api.post<Dock>('/docks', data);
  return response.data;
};

export const updateDock = async (id: number, data: Partial<Dock>): Promise<Dock> => {
  const response = await api.put<Dock>(`/docks/${id}`, data);
  return response.data;
};

export const deleteDock = async (id: number): Promise<void> => {
  await api.delete(`/docks/${id}`);
};

export const getDockSchedule = async (id: number, startDate?: string, endDate?: string): Promise<any[]> => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const response = await api.get<any[]>(`/docks/${id}/schedule`, { params });
  return response.data;
};

export const getDockLoad = async (id: number): Promise<number> => {
  const response = await api.get<number>(`/docks/${id}/load`);
  return response.data;
};
