package com.shipyard.repair.dto.shipyard;

import com.shipyard.repair.enums.ShipyardStatus;

public record ShipyardResponse(
        int id,
        String name,
        ShipyardAddressResponse shipyardAddress,
        ShipyardStatus status
) {}