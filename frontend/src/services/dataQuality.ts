import api from './api';

export interface DataQualityUserIssue {
  userId: number;
  fullName: string;
  email: string;
  role: string;
  dockName: string | null;
  reportsToUserId: number | null;
  reportsToFullName: string | null;
  expectedSupervisorRole: string | null;
  actualSupervisorRole: string | null;
}

export interface DuplicateEmailGroup {
  email: string;
  usersCount: number;
  users: DataQualityUserIssue[];
}

export interface DataQualityResponse {
  withoutSupervisorCount: number;
  withoutDockCount: number;
  invalidHierarchyCount: number;
  duplicateEmailGroupsCount: number;
  withoutSupervisorUsers: DataQualityUserIssue[];
  withoutDockUsers: DataQualityUserIssue[];
  invalidHierarchyUsers: DataQualityUserIssue[];
  duplicateEmailGroups: DuplicateEmailGroup[];
  generatedAt: string;
}

export const getDataQualityReport = async (): Promise<DataQualityResponse> => {
  const response = await api.get<DataQualityResponse>('/admin/data-quality');
  return response.data;
};

