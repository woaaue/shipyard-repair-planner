package com.shipyard.fleet.dto.shipyard;

import com.shipyard.fleet.model.ShipyardStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateShipyardRequest(
        @NotBlank String name,
        @NotNull CreateShipyardAddressRequest shipyardAddress,
        @NotNull ShipyardStatus status
) {
}
