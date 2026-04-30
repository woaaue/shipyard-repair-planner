import api from './api';
import type { User } from '../context/AuthContext';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  role?: 'admin' | 'dispatcher' | 'operator' | 'client' | 'master' | 'worker';
}

export interface AuthResponse {
  user: User;
  token: string;
}

export function getAuthErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string; fields?: Record<string, string> } } }).response;
    const fields = response?.data?.fields;
    if (fields && Object.keys(fields).length > 0) {
      return Object.entries(fields)
        .map(([field, message]) => `${field}: ${message}`)
        .join(', ');
    }
    if (response?.data?.message) {
      return response.data.message;
    }
  }
  return 'Ошибка авторизации';
}

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/login', credentials);
  return response.data;
};

export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/register', data);
  return response.data;
};

export const logout = async (): Promise<void> => {
  await api.post('/auth/logout');
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get<User>('/auth/me');
  return response.data;
};
