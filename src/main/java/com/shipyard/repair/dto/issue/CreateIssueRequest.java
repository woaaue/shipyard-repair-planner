package com.shipyard.repair.dto.issue;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateIssueRequest(
        @NotNull Integer repairId,
        @NotBlank String issueType,
        @NotBlank String description,
        @NotBlank String impact,
        @NotBlank String reportedBy,
        String status
) {
}
