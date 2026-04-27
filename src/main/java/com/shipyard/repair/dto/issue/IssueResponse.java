package com.shipyard.repair.dto.issue;

import java.time.LocalDateTime;

public record IssueResponse(
        int id,
        Integer repairId,
        String issueType,
        String description,
        String impact,
        String status,
        String reportedBy,
        LocalDateTime reportedAt,
        LocalDateTime resolvedAt
) {
}
