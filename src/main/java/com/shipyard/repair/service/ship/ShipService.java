package com.shipyard.repair.service.ship;

import com.shipyard.repair.dto.ship.CreateShipRequest;
import com.shipyard.repair.dto.ship.ShipResponse;
import com.shipyard.repair.dto.ship.UpdateShipRequest;
import com.shipyard.repair.enums.ShipStatus;

import java.util.List;

public interface ShipService {

    List<ShipResponse> getShips(String search, ShipStatus status);

    ShipResponse getShipById(Integer id);

    ShipResponse createShip(CreateShipRequest request);

    ShipResponse updateShip(Integer id, UpdateShipRequest request);

    void deleteShip(Integer id);
}
