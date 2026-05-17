package com.shipyard.repair.service.shipyard;

import com.shipyard.repair.dto.shipyard.CreateShipyardRequest;
import com.shipyard.repair.dto.shipyard.ShipyardResponse;
import com.shipyard.repair.dto.shipyard.UpdateShipyardRequest;
import com.shipyard.repair.enums.ShipyardStatus;

import java.util.List;

public interface ShipyardService {

    List<ShipyardResponse> getShipyards();
    ShipyardResponse getShipyard(Integer id);
    ShipyardResponse createShipyard(CreateShipyardRequest createShipyardRequest);
    ShipyardResponse updateShipyard(Integer id, UpdateShipyardRequest updateShipyardRequest);
    ShipyardResponse updateShipyardStatus(Integer id, ShipyardStatus status);
}
