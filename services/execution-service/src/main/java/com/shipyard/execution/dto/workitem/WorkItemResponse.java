package com.shipyard.execution.dto.workitem;

import com.shipyard.execution.model.WorkCategory;
import com.shipyard.execution.model.WorkItemStatus;

import java.time.LocalDateTime;

public record WorkItemResponse(
        long id,
        Long repairRequestId,
        Long repairId,
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
