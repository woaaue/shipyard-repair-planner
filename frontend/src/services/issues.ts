import api from './api';

export interface IssueResponse {
  id: number;
  repairId: number;
  issueType: string;
  description: string;
  impact: string;
  status: string;
  reportedBy: string;
  reportedAt: string;
  resolvedAt: string | null;
}

export interface CreateIssuePayload {
  repairId: number;
  issueType: string;
  description: string;
  impact: string;
  reportedBy: string;
  status?: string;
}

export const getIssues = async (filters?: {
  repairId?: number;
  status?: string;
}): Promise<IssueResponse[]> => {
  const params = new URLSearchParams();
  if (typeof filters?.repairId === 'number') params.append('repairId', String(filters.repairId));
  if (filters?.status) params.append('status', filters.status);

  const response = await api.get<IssueResponse[]>('/issues', { params });
  return response.data;
};

export const createIssue = async (payload: CreateIssuePayload): Promise<IssueResponse> => {
  const response = await api.post<IssueResponse>('/issues', payload);
  return response.data;
};

export const updateIssueStatus = async (id: number, status: string): Promise<IssueResponse> => {
  const response = await api.patch<IssueResponse>(`/issues/${id}/status`, { status });
  return response.data;
};
