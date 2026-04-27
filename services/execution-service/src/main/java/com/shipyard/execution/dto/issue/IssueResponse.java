package com.shipyard.execution.dto.issue;

import java.time.LocalDateTime;

public record IssueResponse(
        long id,
        Long repairId,
        String issueType,
        String description,
        String impact,
        String status,
        String reportedBy,
        LocalDateTime reportedAt,
        LocalDateTime resolvedAt
) {
}
