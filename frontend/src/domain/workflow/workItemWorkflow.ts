import type { WorkItemResponse } from '../../services/workItems';

export type WorkflowRole = 'worker' | 'master' | 'operator' | 'dispatcher' | 'admin' | 'client';
export type WorkItemUiState = 'IN_PROGRESS' | 'PENDING_REVIEW' | 'COMPLETED';

const REVIEWER_ROLES: WorkflowRole[] = ['master', 'operator', 'dispatcher', 'admin'];

export function isWorkItemCompleted(item: Pick<WorkItemResponse, 'reviewStatus'>): boolean {
  return item.reviewStatus === 'APPROVED';
}

export function getWorkItemUiState(
  item: Pick<WorkItemResponse, 'reviewStatus'>
): WorkItemUiState {
  if (item.reviewStatus === 'APPROVED') return 'COMPLETED';
  if (item.reviewStatus === 'PENDING_REVIEW') return 'PENDING_REVIEW';
  return 'IN_PROGRESS';
}

export function canMarkWorkItemCompleted(
  role: WorkflowRole | undefined,
  item: Pick<WorkItemResponse, 'reviewStatus' | 'assigneeId'>,
  userId?: number
): boolean {
  if (!role) return false;
  if (isWorkItemCompleted(item)) return false;
  if (item.reviewStatus === 'PENDING_REVIEW') return false;
  if (REVIEWER_ROLES.includes(role)) return true;
  return role === 'worker' && typeof userId === 'number' && item.assigneeId === userId;
}

export function canReviewWorkItem(
  role: WorkflowRole | undefined,
  item: Pick<WorkItemResponse, 'reviewStatus'>
): boolean {
  return Boolean(role && REVIEWER_ROLES.includes(role) && item.reviewStatus === 'PENDING_REVIEW');
}

