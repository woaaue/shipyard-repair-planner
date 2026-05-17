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
        Integer assignedDockId,
        String assignedDockName,
        Integer assignedOperatorId,
        String assignedOperatorName,
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
        String rejectionReason,
        String rejectionNote,
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
            Integer assignedDockId,
            String assignedDockName,
            Integer assignedOperatorId,
            String assignedOperatorName,
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
            String rejectionReason,
            String rejectionNote,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
        this(id, shipId, shipName, clientId, clientName, assignedDockId, assignedDockName, assignedOperatorId, assignedOperatorName, status, requestedStartDate, requestedEndDate,
                scheduledStartDate, scheduledEndDate, estimatedDurationDays, contingencyDays, actualDurationDays,
                totalCost, description, notes, rejectionReason, rejectionNote, false, null, null, createdAt, updatedAt);
    }
}
