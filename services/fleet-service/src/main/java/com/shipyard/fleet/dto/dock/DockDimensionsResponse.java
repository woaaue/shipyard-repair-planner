package com.shipyard.fleet.dto.dock;

public record DockDimensionsResponse(
        int maxLength,
        int maxWidth,
        int maxDraft
) {
}
