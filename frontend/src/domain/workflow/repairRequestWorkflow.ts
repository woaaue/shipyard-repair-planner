import type { User } from '../../context/AuthContext';
import type { RepairRequestResponse, RepairRequestStatus } from '../../services/repairRequests';

export type RepairRequestActionKey = 'send_to_review' | 'approve' | 'reject' | 'resubmit';

export interface RepairRequestActionRule {
  key: RepairRequestActionKey;
  label: string;
  targetStatus?: RepairRequestStatus;
}

const DISPATCHER_ACTIONS_BY_STATUS: Partial<Record<RepairRequestStatus, RepairRequestActionRule[]>> = {
  SUBMITTED: [
    { key: 'send_to_review', label: 'В рассмотрение', targetStatus: 'UNDER_REVIEW' },
    { key: 'approve', label: 'Согласовать', targetStatus: 'APPROVED' },
    { key: 'reject', label: 'Отклонить', targetStatus: 'REJECTED' },
  ],
  UNDER_REVIEW: [
    { key: 'approve', label: 'Согласовать', targetStatus: 'APPROVED' },
    { key: 'reject', label: 'Отклонить', targetStatus: 'REJECTED' },
  ],
};

const CLIENT_ACTIONS_BY_STATUS: Partial<Record<RepairRequestStatus, RepairRequestActionRule[]>> = {
  REJECTED: [{ key: 'resubmit', label: 'Подать повторно', targetStatus: 'SUBMITTED' }],
};

function roleCanOperateRequest(role: User['role']): boolean {
  return role === 'dispatcher' || role === 'admin' || role === 'client';
}

export function getAvailableRepairRequestActions(
  role: User['role'] | undefined,
  requestStatus: RepairRequestStatus
): RepairRequestActionRule[] {
  if (!role || !roleCanOperateRequest(role)) return [];
  if (role === 'dispatcher' || role === 'admin') {
    return DISPATCHER_ACTIONS_BY_STATUS[requestStatus] ?? [];
  }
  if (role === 'client') {
    return CLIENT_ACTIONS_BY_STATUS[requestStatus] ?? [];
  }
  return [];
}

export function canRunRepairRequestAction(
  role: User['role'] | undefined,
  requestStatus: RepairRequestStatus,
  actionKey: RepairRequestActionKey
): boolean {
  return getAvailableRepairRequestActions(role, requestStatus).some((action) => action.key === actionKey);
}

export function canClientResubmitRequest(
  role: User['role'] | undefined,
  request: RepairRequestResponse | null,
  currentUserId: number | undefined
): boolean {
  if (!request || role !== 'client' || typeof currentUserId !== 'number') return false;
  if (request.clientId !== currentUserId) return false;
  return canRunRepairRequestAction(role, request.status, 'resubmit');
}

