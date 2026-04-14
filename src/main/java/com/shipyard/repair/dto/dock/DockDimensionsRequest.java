package com.shipyard.repair.dto.dock;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record DockDimensionsRequest(
        @NotNull(message = "{dock.length.blank}")
        @Min(value = 1, message = "{dock.length.min}")
        @Max(value = 500, message = "{dock.length.max}")
        Integer maxLength,

        @NotNull(message = "{dock.width.blank}")
        @Min(value = 1, message = "{dock.width.min}")
        @Max(value = 100, message = "{dock.width.max}")
        Integer maxWidth,

        @NotNull(message = "{dock.draft.blank}")
        @Min(value = 1, message = "{dock.draft.min}")
        @Max(value = 30, message = "{dock.draft.max}")
        Integer maxDraft
) {
}
