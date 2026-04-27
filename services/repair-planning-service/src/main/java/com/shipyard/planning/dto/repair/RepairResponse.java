package com.shipyard.planning.dto.repair;

import com.shipyard.planning.model.RepairStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record RepairResponse(
        long id,
        Long repairRequestId,
        Long dockId,
        String dockName,
        RepairStatus status,
        LocalDate actualStartDate,
        LocalDate actualEndDate,
        int progressPercentage,
        BigDecimal totalCost,
        String notes,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
