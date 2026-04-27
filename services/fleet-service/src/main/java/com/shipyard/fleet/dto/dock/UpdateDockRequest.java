package com.shipyard.fleet.dto.dock;

import com.shipyard.fleet.model.DockStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateDockRequest(
        @NotBlank String name,
        @NotNull DockDimensionsRequest dimensions,
        @NotNull DockStatus status,
        @NotNull Integer shipyardId
) {
}
