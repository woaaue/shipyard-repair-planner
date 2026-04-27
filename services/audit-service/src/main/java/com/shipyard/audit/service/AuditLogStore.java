package com.shipyard.audit.service;

import com.shipyard.audit.dto.AuditLogResponse;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class AuditLogStore {

    private final List<AuditLogResponse> logs = new ArrayList<>();

    @PostConstruct
    void init() {
        logs.add(new AuditLogResponse(
                1L,
                "CREATE",
                "REPAIR_REQUEST",
                101L,
                "dispatcher@shipyard.local",
                2L,
                "Created repair request #101",
                LocalDateTime.now().minusHours(8)
        ));
        logs.add(new AuditLogResponse(
                2L,
                "UPDATE_STATUS",
                "REPAIR",
                88L,
                "operator@shipyard.local",
                3L,
                "Repair moved to IN_PROGRESS",
                LocalDateTime.now().minusHours(2)
        ));
    }

    public List<AuditLogResponse> getAuditLogs(
            String entityType,
            Long entityId,
            Long userId,
            String action,
            LocalDateTime from,
            LocalDateTime to
    ) {
        return logs.stream()
                .filter(log -> entityType == null || log.entityType().equalsIgnoreCase(entityType))
                .filter(log -> entityId == null || log.entityId().equals(entityId))
                .filter(log -> userId == null || log.actorUserId().equals(userId))
                .filter(log -> action == null || log.action().equalsIgnoreCase(action))
                .filter(log -> from == null || !log.createdAt().isBefore(from))
                .filter(log -> to == null || !log.createdAt().isAfter(to))
                .toList();
    }
}
