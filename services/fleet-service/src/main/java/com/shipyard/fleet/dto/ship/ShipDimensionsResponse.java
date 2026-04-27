package com.shipyard.fleet.dto.ship;

public record ShipDimensionsResponse(
        int maxLength,
        int maxWidth,
        int maxDraft
) {
}
