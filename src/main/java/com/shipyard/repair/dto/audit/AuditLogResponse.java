package com.shipyard.repair.dto.audit;

import java.time.LocalDateTime;

public record AuditLogResponse(
        Integer id,
        String action,
        String entityType,
        Integer entityId,
        String actorEmail,
        Integer actorUserId,
        String details,
        LocalDateTime createdAt
) {
}
