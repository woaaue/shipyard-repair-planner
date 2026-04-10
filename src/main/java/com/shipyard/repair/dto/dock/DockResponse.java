package com.shipyard.repair.dto.dock;

import com.shipyard.repair.enums.DockStatus;

public record DockResponse(
        int id,
        String name,
        DockDimensionsResponse dimensions,
        DockStatus status
) {}