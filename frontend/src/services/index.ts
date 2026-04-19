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

export { default as api } from './api';
