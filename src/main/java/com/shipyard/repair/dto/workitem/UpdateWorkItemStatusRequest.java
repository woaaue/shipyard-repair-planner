package com.shipyard.repair.dto.workitem;

import com.shipyard.repair.enums.WorkItemStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateWorkItemStatusRequest(
        @NotNull(message = "Status is required")
        WorkItemStatus status
) {
}
