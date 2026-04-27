package com.shipyard.execution.dto.downtime;

import java.time.LocalDateTime;

public record DowntimeResponse(
        long id,
        String dockName,
        String reason,
        LocalDateTime startDate,
        LocalDateTime endDate,
        LocalDateTime expectedEndDate,
        String notes,
        LocalDateTime createdAt
) {
}
