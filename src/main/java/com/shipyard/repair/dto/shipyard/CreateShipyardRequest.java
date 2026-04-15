package com.shipyard.repair.dto.shipyard;

import com.shipyard.repair.enums.ShipyardStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateShipyardRequest(
        @NotBlank(message = "{shipyard.name.blank}")
        @Size(message = "{shipyard.name.size}", min = 2, max = 50)
        String name,

        @Valid
        @NotNull(message = "{shipyard.shipyardAddress.null}")
        CreateShipyardAddressRequest shipyardAddress,

        @NotNull(message = "{shipyard.status.null}")
        ShipyardStatus status
) {}