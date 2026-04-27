export { login, register, logout, getCurrentUser } from './auth';
export type { LoginCredentials, RegisterData, AuthResponse } from './auth';

export { getShips, getShip, createShip, updateShip, deleteShip } from './ships';
export type { ShipFilters } from './ships';

export {
  getRepairs,
  getRepair,
  createRepair,
  updateRepair,
  updateRepairStatus,
  deleteRepair,
  getRepairsByDock,
  getRepairsByShip,
} from './repairs';
export type { RepairFilters, BackendRepairStatus } from './repairs';

export { getUsers, getUser, createUser, updateUser, blockUser, unblockUser, resetPassword } from './users';
export type { UserFilters } from './users';

export { getDocks, getDock, createDock, updateDock, deleteDock, getDockSchedule, getDockLoad } from './docks';
export type { Dock } from './docks';

export {
  getRepairRequests,
  getRepairRequest,
  createRepairRequest,
  updateRepairRequest,
  updateRepairRequestStatus,
  deleteRepairRequest,
} from './repairRequests';
export type { RepairRequestStatus, RepairRequestResponse, CreateRepairRequestPayload } from './repairRequests';

export {
  getWorkItems,
  getWorkItem,
  createWorkItem,
  updateWorkItem,
  updateWorkItemStatus,
  deleteWorkItem,
} from './workItems';
export type { WorkCategory, WorkItemStatus, WorkItemResponse, WorkItemPayload } from './workItems';

export {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from './notifications';
export type { NotificationResponse, NotificationType } from './notifications';

export { getIssues, createIssue, updateIssueStatus } from './issues';
export type { IssueResponse, CreateIssuePayload } from './issues';

export { getDowntimes, createDowntime, finishDowntime } from './downtimes';
export type { DowntimeResponse, CreateDowntimePayload } from './downtimes';

export { default as api } from './api';
