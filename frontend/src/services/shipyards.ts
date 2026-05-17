import api from './api';

export type ShipyardStatus = 'ACTIVE' | 'MAINTENANCE' | 'CLOSED';

export interface ShipyardAddress {
  city: string;
  street: string;
  postalCode: string;
}

export interface Shipyard {
  id: number;
  name: string;
  status: ShipyardStatus;
  shipyardAddress: ShipyardAddress;
}

interface BackendShipyardResponse {
  id: number;
  name: string;
  status: ShipyardStatus;
  shipyardAddress: ShipyardAddress;
}

export interface ShipyardUpsertInput {
  name: string;
  status: ShipyardStatus;
  shipyardAddress: ShipyardAddress;
}

function mapBackendShipyard(data: BackendShipyardResponse): Shipyard {
  return {
    id: data.id,
    name: data.name,
    status: data.status,
    shipyardAddress: data.shipyardAddress,
  };
}

export const getShipyards = async (): Promise<Shipyard[]> => {
  const response = await api.get<BackendShipyardResponse[]>('/shipyards');
  return response.data.map(mapBackendShipyard);
};

export const createShipyard = async (payload: ShipyardUpsertInput): Promise<Shipyard> => {
  const response = await api.post<BackendShipyardResponse>('/shipyards', payload);
  return mapBackendShipyard(response.data);
};

export const updateShipyard = async (id: number, payload: ShipyardUpsertInput): Promise<Shipyard> => {
  const response = await api.put<BackendShipyardResponse>(`/shipyards/${id}`, payload);
  return mapBackendShipyard(response.data);
};

export const updateShipyardStatus = async (id: number, status: ShipyardStatus): Promise<Shipyard> => {
  const response = await api.patch<BackendShipyardResponse>(`/shipyards/${id}/status`, { status });
  return mapBackendShipyard(response.data);
};
