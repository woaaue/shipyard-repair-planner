package com.shipyard.repair.dto.dock;

public record DockDimensionsResponse(
        Integer maxLength,
        Integer maxWidth,
        Integer maxDraft
) {}