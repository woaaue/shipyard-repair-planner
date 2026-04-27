package com.shipyard.fleet.dto.dock;

public record DockDimensionsRequest(
        int maxLength,
        int maxWidth,
        int maxDraft
) {
}
