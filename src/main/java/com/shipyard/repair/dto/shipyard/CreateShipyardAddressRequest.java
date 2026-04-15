package com.shipyard.repair.dto.shipyard;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateShipyardAddressRequest(
        @NotBlank(message = "{shipyardAddress.city.blank}")
        @Size(message = "{shipyardAddress.city.size}", min = 2, max = 50)
        String city,

        @NotBlank(message = "{shipyardAddress.street.blank}")
        @Size(message = "{shipyardAddress.street.size}", min = 2, max = 100)
        String street,

        @NotBlank(message = "{shipyardAddress.postalCode.blank}")
        @Size(message = "{shipyardAddress.postalCode.size}", min = 2, max = 15)
        String postalCode
) {}