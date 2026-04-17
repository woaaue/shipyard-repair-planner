package com.shipyard.repair.dto.ship;

import com.shipyard.repair.enums.ShipStatus;
import com.shipyard.repair.enums.ShipType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateShipRequest(
        @NotBlank(message = "{ship.regNumber.blank}")
        @Size(min = 6, max = 20, message = "{ship.regNumber.size}")
        String regNumber,

        @NotBlank(message = "{ship.name.blank}")
        @Size(min = 2, max = 50, message = "{ship.name.size}")
        String name,

        @NotNull(message = "{ship.type.blank}")
        ShipType shipType,

        @Valid
        @NotNull(message = "{ship.dimensions.blank}")
        ShipDimensionsRequest shipDimensions,

        @NotNull(message = "{ship.owner.blank}")
        Integer userId,

        @NotNull(message = "{ship.status.blank}")
        ShipStatus shipStatus,

        Integer dockId
) {
}
