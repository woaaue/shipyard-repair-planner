package com.shipyard.repair.service.shipyard;

import com.shipyard.repair.dto.shipyard.CreateShipyardRequest;
import com.shipyard.repair.dto.shipyard.ShipyardResponse;
import com.shipyard.repair.entity.Shipyard;

import java.util.List;

public interface ShipyardService {

    List<ShipyardResponse> getShipyards();
    ShipyardResponse getShipyard(Integer id);
    ShipyardResponse createShipyard(CreateShipyardRequest createShipyardRequest);
    void deleteShipyard(Integer id);
}
