import api from './api';

export interface AuditLogRecord {
  id: number;
  action: string;
  entityType: string;
  entityId: number | null;
  actorEmail: string | null;
  actorUserId: number | null;
  details: string | null;
  createdAt: string;
}

export interface AuditLogFilters {
  entityType?: string;
  entityId?: number;
  userId?: number;
  action?: string;
  from?: string;
  to?: string;
}

export const getAuditLogs = async (filters?: AuditLogFilters): Promise<AuditLogRecord[]> => {
  const params = new URLSearchParams();
  if (filters?.entityType) params.append('entityType', filters.entityType);
  if (typeof filters?.entityId === 'number') params.append('entityId', String(filters.entityId));
  if (typeof filters?.userId === 'number') params.append('userId', String(filters.userId));
  if (filters?.action) params.append('action', filters.action);
  if (filters?.from) params.append('from', filters.from);
  if (filters?.to) params.append('to', filters.to);

  const response = await api.get<AuditLogRecord[]>('/audit-logs', { params });
  return response.data;
};

