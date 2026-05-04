package com.shipyard.repair.dto.workitem;

import com.shipyard.repair.enums.WorkItemReviewStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateWorkItemReviewRequest(
        @NotNull(message = "Review status is required")
        WorkItemReviewStatus reviewStatus
) {
}
