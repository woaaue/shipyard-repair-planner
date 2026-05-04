package com.shipyard.repair.dto.workitem;

import com.shipyard.repair.enums.WorkCategory;
import com.shipyard.repair.enums.WorkItemReviewStatus;
import com.shipyard.repair.enums.WorkItemStatus;

import java.time.LocalDateTime;

public record WorkItemResponse(
        int id,
        Integer repairRequestId,
        Integer repairId,
        WorkCategory category,
        String name,
        String description,
        WorkItemStatus status,
        int estimatedHours,
        int actualHours,
        boolean isMandatory,
        boolean isDiscovered,
        String notes,
        Integer assigneeId,
        String assigneeFullName,
        WorkItemReviewStatus reviewStatus,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public WorkItemResponse(
            int id,
            Integer repairRequestId,
            Integer repairId,
            WorkCategory category,
            String name,
            String description,
            WorkItemStatus status,
            int estimatedHours,
            int actualHours,
            boolean isMandatory,
            boolean isDiscovered,
            String notes,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
        this(id, repairRequestId, repairId, category, name, description, status, estimatedHours, actualHours,
                isMandatory, isDiscovered, notes, null, null, WorkItemReviewStatus.NOT_SUBMITTED, createdAt, updatedAt);
    }
}
