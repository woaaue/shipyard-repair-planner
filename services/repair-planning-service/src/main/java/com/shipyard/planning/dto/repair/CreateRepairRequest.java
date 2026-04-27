package com.shipyard.planning.dto.repair;

import com.shipyard.planning.model.RepairStatus;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateRepairRequest(
        @NotNull Long repairRequestId,
        @NotNull Long dockId,
        RepairStatus status,
        LocalDate actualStartDate,
        LocalDate actualEndDate,
        Integer progressPercentage,
        BigDecimal totalCost,
        String notes
) {
}
