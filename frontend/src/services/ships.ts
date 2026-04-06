import api from './api';
import type { Ship } from '../types/repair';

export interface ShipFilters {
  search?: string;
  status?: string;
}

export const getShips = async (filters?: ShipFilters): Promise<Ship[]> => {
  const params = new URLSearchParams();
  if (filters?.search) params.append('search', filters.search);
  if (filters?.status) params.append('status', filters.status);

  const response = await api.get<Ship[]>('/ships', { params });
  return response.data;
};

export const getShip = async (id: number): Promise<Ship> => {
  const response = await api.get<Ship>(`/ships/${id}`);
  return response.data;
};

export const createShip = async (data: Omit<Ship, 'id'>): Promise<Ship> => {
  const response = await api.post<Ship>('/ships', data);
  return response.data;
};

export const updateShip = async (id: number, data: Partial<Ship>): Promise<Ship> => {
  const response = await api.put<Ship>(`/ships/${id}`, data);
  return response.data;
};

export const deleteShip = async (id: number): Promise<void> => {
  await api.delete(`/ships/${id}`);
};
