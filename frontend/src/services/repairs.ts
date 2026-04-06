import api from './api';
import type { ExtendedRepair } from '../types/repair';

export interface RepairFilters {
  search?: string;
  status?: string;
  dock?: string;
  repairType?: string;
  priority?: string;
}

export const getRepairs = async (filters?: RepairFilters): Promise<ExtendedRepair[]> => {
  const params = new URLSearchParams();
  if (filters?.search) params.append('search', filters.search);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.dock) params.append('dock', filters.dock);
  if (filters?.repairType) params.append('repairType', filters.repairType);
  if (filters?.priority) params.append('priority', filters.priority);

  const response = await api.get<ExtendedRepair[]>('/repairs', { params });
  return response.data;
};

export const getRepair = async (id: number): Promise<ExtendedRepair> => {
  const response = await api.get<ExtendedRepair>(`/repairs/${id}`);
  return response.data;
};

export const createRepair = async (data: Omit<ExtendedRepair, 'id'>): Promise<ExtendedRepair> => {
  const response = await api.post<ExtendedRepair>('/repairs', data);
  return response.data;
};

export const updateRepair = async (id: number, data: Partial<ExtendedRepair>): Promise<ExtendedRepair> => {
  const response = await api.put<ExtendedRepair>(`/repairs/${id}`, data);
  return response.data;
};

export const deleteRepair = async (id: number): Promise<void> => {
  await api.delete(`/repairs/${id}`);
};

export const getRepairsByDock = async (dock: string): Promise<ExtendedRepair[]> => {
  const response = await api.get<ExtendedRepair[]>(`/repairs/dock/${dock}`);
  return response.data;
};

export const getRepairsByShip = async (shipId: number): Promise<ExtendedRepair[]> => {
  const response = await api.get<ExtendedRepair[]>(`/repairs/ship/${shipId}`);
  return response.data;
};
