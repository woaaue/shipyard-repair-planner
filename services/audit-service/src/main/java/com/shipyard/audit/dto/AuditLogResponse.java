package com.shipyard.audit.dto;

import java.time.LocalDateTime;

public record AuditLogResponse(
        long id,
        String action,
        String entityType,
        Long entityId,
        String actorEmail,
        Long actorUserId,
        String details,
        LocalDateTime createdAt
) {
}
