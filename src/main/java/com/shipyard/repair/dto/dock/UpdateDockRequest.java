package com.shipyard.repair.dto.dock;

import com.shipyard.repair.enums.DockStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateDockRequest(
        @NotBlank(message = "{dock.name.blank}")
        @Size(min = 3, max = 100, message = "{dock.name.size}")
        String name,

        @Valid
        @NotNull(message = "{dock.dimensions.blank}")
        DockDimensionsRequest dimensions,

        @NotNull(message = "{dock.status.blank}")
        DockStatus status,

        @NotNull(message = "{dock.shipyard.blank}")
        Integer shipyardId
) {
}
