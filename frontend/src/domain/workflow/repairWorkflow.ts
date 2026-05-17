import type { BackendRepairStatus } from '../../services/repairs';
import type { ExtendedRepair } from '../../types/repair';

export type RepairWorkflowRole = 'worker' | 'master' | 'operator' | 'dispatcher' | 'admin' | 'client';

const LOCAL_TO_BACKEND_STATUS: Record<ExtendedRepair['status'], BackendRepairStatus> = {
  'запланирован': 'SCHEDULED',
  'в работе': 'IN_PROGRESS',
  'завершён': 'COMPLETED',
  'отменён': 'CANCELLED',
};

export function toBackendRepairStatus(status: ExtendedRepair['status']): BackendRepairStatus {
  return LOCAL_TO_BACKEND_STATUS[status] ?? 'SCHEDULED';
}

export function deriveBackendStatusFromProgress(
  repair: Pick<ExtendedRepair, 'progress'>
): BackendRepairStatus {
  if (repair.progress >= 100) return 'COMPLETED';
  if (repair.progress > 0) return 'IN_PROGRESS';
  return 'SCHEDULED';
}

export function getNextRepairStatus(status: ExtendedRepair['status']): ExtendedRepair['status'] {
  if (status === 'запланирован') return 'в работе';
  if (status === 'в работе') return 'завершён';
  return 'запланирован';
}

export function canAcceptRepairByClient(
  role: RepairWorkflowRole | undefined,
  context: {
    currentUserId?: number;
    requestClientId?: number;
    repairStatus: ExtendedRepair['status'];
    clientAccepted: boolean;
    taskCount: number;
    allTasksApproved: boolean;
  }
): boolean {
  return Boolean(
    role === 'client' &&
      typeof context.currentUserId === 'number' &&
      typeof context.requestClientId === 'number' &&
      context.currentUserId === context.requestClientId &&
      context.repairStatus === 'завершён' &&
      !context.clientAccepted &&
      context.taskCount > 0 &&
      context.allTasksApproved
  );
}

