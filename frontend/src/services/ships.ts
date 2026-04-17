import api from './api';
import type { Ship } from '../types/repair';

export interface ShipFilters {
  search?: string;
  status?: string;
}

export interface ShipFormPayload {
  name: string;
  imo: string;
  type: string;
  status: string;
  ownerId: number;
  length: number;
  width: number;
  draft: number;
  dockId?: number;
}

type BackendShipType =
  | 'TANKER'
  | 'BULK_CARRIER'
  | 'CONTAINER_SHIP'
  | 'RO_RO'
  | 'PASSENGER'
  | 'FERRY'
  | 'TUG'
  | 'FISHING'
  | 'DREDGER'
  | 'OTHER';

type BackendShipStatus = 'IDLE' | 'WAITING' | 'UNDER_REPAIR' | 'COMPLETED';

interface BackendShip {
  id: number;
  regNumber: string;
  name: string;
  shipType: BackendShipType;
  shipStatus: BackendShipStatus;
  shipDimensions: {
    maxLength: number;
    maxWidth: number;
    maxDraft: number;
  };
  userId: number;
  ownerName: string;
  dockId?: number | null;
  dockName?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BackendShipRequest {
  regNumber: string;
  name: string;
  shipType: BackendShipType;
  shipStatus: BackendShipStatus;
  userId: number;
  dockId?: number;
  shipDimensions: {
    maxLength: number;
    maxWidth: number;
    maxDraft: number;
  };
}

const typeToUi: Record<BackendShipType, string> = {
  CONTAINER_SHIP: 'Контейнеровоз',
  TANKER: 'Танкер',
  BULK_CARRIER: 'Балкер',
  RO_RO: 'Ролкер',
  PASSENGER: 'Пассажирское',
  FERRY: 'Паром',
  TUG: 'Буксир',
  FISHING: 'Рыболовное',
  DREDGER: 'Земснаряд',
  OTHER: 'Другое',
};

const statusToUi: Record<BackendShipStatus, string> = {
  UNDER_REPAIR: 'в ремонте',
  WAITING: 'ожидает',
  IDLE: 'в плавании',
  COMPLETED: 'в плавании',
};

const uiToType: Record<string, BackendShipType> = {
  Контейнеровоз: 'CONTAINER_SHIP',
  Танкер: 'TANKER',
  Балкер: 'BULK_CARRIER',
  Ролкер: 'RO_RO',
  Пассажирское: 'PASSENGER',
  Паром: 'FERRY',
  Буксир: 'TUG',
  Рыболовное: 'FISHING',
  Земснаряд: 'DREDGER',
  Другое: 'OTHER',
};

const uiToStatus: Record<string, BackendShipStatus> = {
  'в ремонте': 'UNDER_REPAIR',
  ожидает: 'WAITING',
  'в плавании': 'IDLE',
};

function mapToUiShip(ship: BackendShip): Ship {
  const createdDate = new Date(ship.createdAt);
  const updatedDate = new Date(ship.updatedAt);

  return {
    id: ship.id,
    name: ship.name,
    imo: ship.regNumber,
    type: (typeToUi[ship.shipType] ?? 'Другое') as Ship['type'],
    status: (statusToUi[ship.shipStatus] ?? 'ожидает') as Ship['status'],
    buildYear: Number.isNaN(createdDate.getFullYear()) ? new Date().getFullYear() : createdDate.getFullYear(),
    owner: ship.ownerName,
    lastRepairDate: Number.isNaN(createdDate.getTime()) ? new Date().toISOString().slice(0, 10) : ship.createdAt.slice(0, 10),
    nextRepairDate: Number.isNaN(updatedDate.getTime()) ? new Date().toISOString().slice(0, 10) : ship.updatedAt.slice(0, 10),
  };
}

function mapToBackendRequest(payload: ShipFormPayload): BackendShipRequest {
  return {
    regNumber: payload.imo,
    name: payload.name,
    shipType: uiToType[payload.type] ?? 'OTHER',
    shipStatus: uiToStatus[payload.status] ?? 'WAITING',
    userId: payload.ownerId,
    dockId: payload.dockId,
    shipDimensions: {
      maxLength: payload.length,
      maxWidth: payload.width,
      maxDraft: payload.draft,
    },
  };
}

function mapStatusFilter(status?: string): BackendShipStatus | undefined {
  if (!status || status === 'все') return undefined;
  return uiToStatus[status] ?? undefined;
}

export const getShips = async (filters?: ShipFilters): Promise<Ship[]> => {
  const params = new URLSearchParams();
  if (filters?.search) params.append('search', filters.search);

  const backendStatus = mapStatusFilter(filters?.status);
  if (backendStatus) params.append('status', backendStatus);

  const response = await api.get<BackendShip[]>('/ships', { params });
  return response.data.map(mapToUiShip);
};

export const getShip = async (id: number): Promise<Ship> => {
  const response = await api.get<BackendShip>(`/ships/${id}`);
  return mapToUiShip(response.data);
};

export const createShip = async (data: ShipFormPayload): Promise<Ship> => {
  const response = await api.post<BackendShip>('/ships', mapToBackendRequest(data));
  return mapToUiShip(response.data);
};

export const updateShip = async (id: number, data: ShipFormPayload): Promise<Ship> => {
  const response = await api.put<BackendShip>(`/ships/${id}`, mapToBackendRequest(data));
  return mapToUiShip(response.data);
};

export const deleteShip = async (id: number): Promise<void> => {
  await api.delete(`/ships/${id}`);
};
