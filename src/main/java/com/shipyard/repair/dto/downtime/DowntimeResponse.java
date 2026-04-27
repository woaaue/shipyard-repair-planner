package com.shipyard.repair.dto.downtime;

import java.time.LocalDateTime;

public record DowntimeResponse(
        int id,
        String dockName,
        String reason,
        LocalDateTime startDate,
        LocalDateTime endDate,
        LocalDateTime expectedEndDate,
        String notes,
        LocalDateTime createdAt
) {
}
