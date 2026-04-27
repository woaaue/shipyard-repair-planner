package com.shipyard.planning.dto.repairrequest;

import com.shipyard.planning.model.RepairRequestStatus;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record UpdateRepairRequest(
        @NotNull Long shipId,
        @NotNull Long clientId,
        LocalDate requestedStartDate,
        LocalDate requestedEndDate,
        LocalDate scheduledStartDate,
        LocalDate scheduledEndDate,
        Integer estimatedDurationDays,
        Integer contingencyDays,
        Integer actualDurationDays,
        BigDecimal totalCost,
        String description,
        String notes,
        RepairRequestStatus status
) {
}
