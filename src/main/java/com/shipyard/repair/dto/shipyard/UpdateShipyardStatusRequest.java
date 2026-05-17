package com.shipyard.repair.dto.shipyard;

import com.shipyard.repair.enums.ShipyardStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateShipyardStatusRequest(
        @NotNull(message = "{shipyard.status.null}")
        ShipyardStatus status
) {
}
