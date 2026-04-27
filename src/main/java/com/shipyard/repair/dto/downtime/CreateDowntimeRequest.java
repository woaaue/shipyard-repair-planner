package com.shipyard.repair.dto.downtime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record CreateDowntimeRequest(
        @NotBlank String dockName,
        @NotBlank String reason,
        @NotNull LocalDateTime startDate,
        LocalDateTime expectedEndDate,
        String notes
) {
}
