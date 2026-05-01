package com.shipyard.repair.dto.repair;

import com.shipyard.repair.enums.RepairStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record RepairResponse(
        int id,
        Integer repairRequestId,
        Integer dockId,
        String dockName,
        Integer operatorId,
        String operatorFullName,
        RepairStatus status,
        LocalDate actualStartDate,
        LocalDate actualEndDate,
        int progressPercentage,
        BigDecimal totalCost,
        String notes,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public RepairResponse(
            int id,
            Integer repairRequestId,
            Integer dockId,
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
        this(id, repairRequestId, dockId, dockName, null, null, status, actualStartDate, actualEndDate,
                progressPercentage, totalCost, notes, createdAt, updatedAt);
    }
}
