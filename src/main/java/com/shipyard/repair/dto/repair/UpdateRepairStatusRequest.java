package com.shipyard.repair.dto.repair;

import com.shipyard.repair.enums.RepairStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateRepairStatusRequest(
        @NotNull(message = "Status is required")
        RepairStatus status
) {
}
