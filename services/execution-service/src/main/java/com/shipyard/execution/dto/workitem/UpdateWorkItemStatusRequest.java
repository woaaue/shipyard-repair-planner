package com.shipyard.execution.dto.workitem;

import com.shipyard.execution.model.WorkItemStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateWorkItemStatusRequest(
        @NotNull WorkItemStatus status
) {
}
