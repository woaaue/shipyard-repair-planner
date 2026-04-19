import api from './api';
import type { User } from '../context/AuthContext';

export interface UserFilters {
  search?: string;
  role?: User['role'];
}

type BackendUserRole = 'ADMIN' | 'DISPATCHER' | 'OPERATOR' | 'MASTER' | 'WORKER' | 'CLIENT';

interface BackendDockRef {
  id: number;
  name: string;
}

interface BackendUserResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  patronymic: string | null;
  role: BackendUserRole;
  dock: BackendDockRef | null;
  createdAt: string;
}

interface BackendCreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  patronymic?: string | null;
  role: BackendUserRole;
  dockId?: number | null;
}

const backendToUiRole: Record<BackendUserRole, User['role']> = {
  ADMIN: 'admin',
  DISPATCHER: 'dispatcher',
  OPERATOR: 'operator',
  MASTER: 'master',
  WORKER: 'worker',
  CLIENT: 'client',
};

const uiToBackendRole: Record<User['role'], BackendUserRole> = {
  admin: 'ADMIN',
  dispatcher: 'DISPATCHER',
  operator: 'OPERATOR',
  master: 'MASTER',
  worker: 'WORKER',
  client: 'CLIENT',
};

function toUiUser(user: BackendUserResponse): User {
  const fullName = [user.lastName, user.firstName, user.patronymic].filter(Boolean).join(' ').trim();
  return {
    id: user.id,
    email: user.email,
    fullName,
    role: backendToUiRole[user.role] ?? 'client',
    dock: user.dock?.name ?? undefined,
  };
}

function splitFullName(fullName: string): { firstName: string; lastName: string; patronymic?: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: 'User', lastName: 'User' };
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
  if (parts.length === 2) return { lastName: parts[0], firstName: parts[1] };
  return { lastName: parts[0], firstName: parts[1], patronymic: parts[2] };
}

export const getUsers = async (filters?: UserFilters): Promise<User[]> => {
  const response = await api.get<BackendUserResponse[]>('/users');
  let users = response.data.map(toUiUser);

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    users = users.filter((u) => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }
  if (filters?.role) {
    users = users.filter((u) => u.role === filters.role);
  }
  return users;
};

export const getUser = async (id: string): Promise<User> => {
  const response = await api.get<BackendUserResponse>(`/users/${id}`);
  return toUiUser(response.data);
};

export const createUser = async (
  data: Omit<User, 'id'> & { password: string; dockId?: number }
): Promise<User> => {
  const names = splitFullName(data.fullName);
  const payload: BackendCreateUserRequest = {
    email: data.email,
    password: data.password,
    firstName: names.firstName,
    lastName: names.lastName,
    patronymic: names.patronymic,
    role: uiToBackendRole[data.role],
    dockId: data.dockId ?? null,
  };

  const response = await api.post<BackendUserResponse>('/users', payload);
  return toUiUser(response.data);
};

export const updateUser = async (): Promise<User> => {
  throw new Error('User update endpoint is not implemented on backend yet');
};

export const blockUser = async (): Promise<User> => {
  throw new Error('User block endpoint is not implemented on backend yet');
};

export const unblockUser = async (): Promise<User> => {
  throw new Error('User unblock endpoint is not implemented on backend yet');
};

export const resetPassword = async (): Promise<string> => {
  throw new Error('User reset-password endpoint is not implemented on backend yet');
};
