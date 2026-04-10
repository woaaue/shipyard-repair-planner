package com.shipyard.repair.dto.shipyard;

public record ShipyardAddressResponse(
        String city,
        String street,
        String postalCode
) {}