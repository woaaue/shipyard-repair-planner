package com.shipyard.fleet.dto.ship;

import com.shipyard.fleet.model.ShipStatus;
import com.shipyard.fleet.model.ShipType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateShipRequest(
        @NotBlank String regNumber,
        @NotBlank String name,
        @NotNull ShipType shipType,
        @NotNull ShipDimensionsRequest shipDimensions,
        @NotNull Integer userId,
        @NotNull ShipStatus shipStatus,
        Integer dockId
) {
}
