package com.shipyard.fleet.dto.shipyard;

import com.shipyard.fleet.model.ShipyardStatus;

public record ShipyardResponse(
        int id,
        String name,
        ShipyardAddressResponse shipyardAddress,
        ShipyardStatus status
) {
}
