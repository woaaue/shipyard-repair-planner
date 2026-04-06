import api from './api';
import type { User } from '../context/AuthContext';

export interface UserFilters {
  search?: string;
  role?: string;
}

export const getUsers = async (filters?: UserFilters): Promise<User[]> => {
  const params = new URLSearchParams();
  if (filters?.search) params.append('search', filters.search);
  if (filters?.role) params.append('role', filters.role);

  const response = await api.get<User[]>('/users', { params });
  return response.data;
};

export const getUser = async (id: string): Promise<User> => {
  const response = await api.get<User>(`/users/${id}`);
  return response.data;
};

export const createUser = async (data: Omit<User, 'id'> & { password: string }): Promise<User> => {
  const response = await api.post<User>('/users', data);
  return response.data;
};

export const updateUser = async (id: string, data: Partial<User>): Promise<User> => {
  const response = await api.put<User>(`/users/${id}`, data);
  return response.data;
};

export const blockUser = async (id: string): Promise<User> => {
  const response = await api.post<User>(`/users/${id}/block`);
  return response.data;
};

export const unblockUser = async (id: string): Promise<User> => {
  const response = await api.post<User>(`/users/${id}/unblock`);
  return response.data;
};

export const resetPassword = async (id: string): Promise<string> => {
  const response = await api.post<{ tempPassword: string }>(`/users/${id}/reset-password`);
  return response.data.tempPassword;
};
