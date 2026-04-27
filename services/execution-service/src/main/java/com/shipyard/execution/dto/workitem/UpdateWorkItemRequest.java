package com.shipyard.execution.dto.workitem;

import com.shipyard.execution.model.WorkCategory;
import com.shipyard.execution.model.WorkItemStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateWorkItemRequest(
        @NotNull Long repairRequestId,
        Long repairId,
        @NotNull WorkCategory category,
        @NotBlank String name,
        String description,
        WorkItemStatus status,
        @Min(0) Integer estimatedHours,
        @Min(0) Integer actualHours,
        Boolean isMandatory,
        Boolean isDiscovered,
        String notes
) {
}
