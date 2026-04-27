package com.shipyard.execution.dto.downtime;

import java.time.LocalDateTime;

public record FinishDowntimeRequest(
        LocalDateTime endDate
) {
}
