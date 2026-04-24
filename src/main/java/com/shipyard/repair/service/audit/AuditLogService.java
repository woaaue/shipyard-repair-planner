package com.shipyard.repair.service.audit;

import com.shipyard.repair.dto.audit.AuditLogResponse;

import java.time.LocalDateTime;
import java.util.List;

public interface AuditLogService {

    List<AuditLogResponse> getAuditLogs(
            String entityType,
            Integer entityId,
            Integer userId,
            String action,
            LocalDateTime from,
            LocalDateTime to
    );

    void log(String action, String entityType, Integer entityId, String details);
}
