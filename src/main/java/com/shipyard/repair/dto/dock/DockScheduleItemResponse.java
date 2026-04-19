package com.shipyard.repair.dto.dock;

import com.shipyard.repair.enums.RepairStatus;

import java.time.LocalDate;

public record DockScheduleItemResponse(
        int repairId,
        int repairRequestId,
        String shipName,
        RepairStatus status,
        LocalDate startDate,
        LocalDate endDate,
        int progressPercentage
) {
}
