package com.shipyard.repair.dto.issue;

import jakarta.validation.constraints.NotBlank;

public record UpdateIssueStatusRequest(
        @NotBlank String status
) {
}
