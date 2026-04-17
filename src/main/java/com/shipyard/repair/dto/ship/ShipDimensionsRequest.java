package com.shipyard.repair.dto.ship;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record ShipDimensionsRequest(
        @NotNull(message = "{ship.length.blank}")
        @Min(value = 1, message = "{ship.length.min}")
        @Max(value = 500, message = "{ship.length.max}")
        Integer maxLength,

        @NotNull(message = "{ship.width.blank}")
        @Min(value = 1, message = "{ship.width.min}")
        @Max(value = 100, message = "{ship.width.max}")
        Integer maxWidth,

        @NotNull(message = "{ship.draft.blank}")
        @Min(value = 1, message = "{ship.draft.min}")
        @Max(value = 30, message = "{ship.draft.max}")
        Integer maxDraft
) {
}
