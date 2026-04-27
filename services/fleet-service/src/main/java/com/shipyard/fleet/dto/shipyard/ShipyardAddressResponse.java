package com.shipyard.fleet.dto.shipyard;

public record ShipyardAddressResponse(
        String country,
        String city,
        String street,
        String zipCode
) {
}
