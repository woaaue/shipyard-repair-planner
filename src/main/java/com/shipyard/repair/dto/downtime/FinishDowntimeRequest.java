package com.shipyard.repair.dto.downtime;

import java.time.LocalDateTime;

public record FinishDowntimeRequest(
        LocalDateTime endDate
) {
}
