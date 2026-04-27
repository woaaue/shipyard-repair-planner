package com.shipyard.fleet.dto.dock;

import com.shipyard.fleet.model.DockStatus;

public record DockResponse(
        int id,
        String name,
        DockDimensionsResponse dimensions,
        DockStatus status
) {
}
