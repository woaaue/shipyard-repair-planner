package com.shipyard.execution.dto.issue;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateIssueRequest(
        @NotNull Long repairId,
        @NotBlank String issueType,
        @NotBlank String description,
        @NotBlank String impact,
        @NotBlank String reportedBy,
        String status
) {
}
