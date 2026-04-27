package com.shipyard.fleet.dto.shipyard;

public record CreateShipyardAddressRequest(
        String country,
        String city,
        String street,
        String zipCode
) {
}
