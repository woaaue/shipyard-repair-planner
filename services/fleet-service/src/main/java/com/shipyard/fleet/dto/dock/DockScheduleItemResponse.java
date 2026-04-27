package com.shipyard.fleet.dto.dock;

import java.time.LocalDate;

public record DockScheduleItemResponse(
        Integer repairId,
        Integer repairRequestId,
        String shipName,
        String status,
        LocalDate startDate,
        LocalDate endDate,
        int progressPercentage
) {
}
