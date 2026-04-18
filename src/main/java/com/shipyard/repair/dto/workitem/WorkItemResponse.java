package com.shipyard.repair.dto.workitem;

import com.shipyard.repair.enums.WorkCategory;
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
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
