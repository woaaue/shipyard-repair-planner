package com.shipyard.planning.dto.repairrequest;

import com.shipyard.planning.model.RepairRequestStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record RepairRequestResponse(
        long id,
        Long shipId,
        String shipName,
        Long clientId,
        String clientName,
        RepairRequestStatus status,
        LocalDate requestedStartDate,
        LocalDate requestedEndDate,
        LocalDate scheduledStartDate,
        LocalDate scheduledEndDate,
        int estimatedDurationDays,
        int contingencyDays,
        int actualDurationDays,
        BigDecimal totalCost,
        String description,
        String notes,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
