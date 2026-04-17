package com.shipyard.repair.dto.ship;

public record ShipDimensionsResponse(
        Integer maxLength,
        Integer maxWidth,
        Integer maxDraft
) {
}
