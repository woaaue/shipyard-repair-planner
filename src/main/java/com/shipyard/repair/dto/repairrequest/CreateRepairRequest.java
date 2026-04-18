package com.shipyard.repair.dto.repairrequest;

import com.shipyard.repair.enums.RepairRequestStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateRepairRequest(
        @NotNull(message = "{ship.not.found}")
        Integer shipId,

        @NotNull(message = "{user.not.found}")
        Integer clientId,

        LocalDate requestedStartDate,
        LocalDate requestedEndDate,
        LocalDate scheduledStartDate,
        LocalDate scheduledEndDate,

        @Min(value = 1, message = "Estimated duration must be >= 1")
        Integer estimatedDurationDays,

        @Min(value = 0, message = "Contingency days must be >= 0")
        Integer contingencyDays,

        Integer actualDurationDays,
        BigDecimal totalCost,

        @Size(max = 1000, message = "Description max length is 1000")
        String description,

        @Size(max = 500, message = "Notes max length is 500")
        String notes,

        RepairRequestStatus status
) {
}
