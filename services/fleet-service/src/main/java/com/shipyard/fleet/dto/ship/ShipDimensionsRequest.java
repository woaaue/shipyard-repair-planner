package com.shipyard.fleet.dto.ship;

public record ShipDimensionsRequest(
        int maxLength,
        int maxWidth,
        int maxDraft
) {
}
