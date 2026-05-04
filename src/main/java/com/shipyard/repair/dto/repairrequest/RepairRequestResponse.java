package com.shipyard.repair.dto.repairrequest;

import com.shipyard.repair.enums.RepairRequestStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record RepairRequestResponse(
        int id,
        Integer shipId,
        String shipName,
        Integer clientId,
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
        boolean clientAccepted,
        LocalDateTime clientAcceptedAt,
        String clientAcceptanceNote,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public RepairRequestResponse(
            int id,
            Integer shipId,
            String shipName,
            Integer clientId,
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
        this(id, shipId, shipName, clientId, clientName, status, requestedStartDate, requestedEndDate,
                scheduledStartDate, scheduledEndDate, estimatedDurationDays, contingencyDays, actualDurationDays,
                totalCost, description, notes, false, null, null, createdAt, updatedAt);
    }
}
