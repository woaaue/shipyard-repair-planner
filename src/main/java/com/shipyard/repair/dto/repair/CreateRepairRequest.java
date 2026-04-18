package com.shipyard.repair.dto.repair;

import com.shipyard.repair.enums.RepairStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateRepairRequest(
        @NotNull(message = "{repairRequest.not.found}")
        Integer repairRequestId,

        @NotNull(message = "{dock.not.found}")
        Integer dockId,

        RepairStatus status,
        LocalDate actualStartDate,
        LocalDate actualEndDate,

        @Min(value = 0, message = "Progress must be >= 0")
        @Max(value = 100, message = "Progress must be <= 100")
        Integer progressPercentage,

        BigDecimal totalCost,

        @Size(max = 1000, message = "Notes max length is 1000")
        String notes
) {
}
