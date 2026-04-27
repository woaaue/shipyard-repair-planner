package com.shipyard.execution.dto.issue;

import jakarta.validation.constraints.NotBlank;

public record UpdateIssueStatusRequest(
        @NotBlank String status
) {
}
