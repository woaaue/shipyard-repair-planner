package com.shipyard.repair.embeddable;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class ShipyardAddress {

    @Column(nullable = false, length = 50)
    private String city;

    @Column(nullable = false, length = 100)
    private String street;

    @Column(name = "postal_code", nullable = false, length = 15)
    private String postalCode;
}
