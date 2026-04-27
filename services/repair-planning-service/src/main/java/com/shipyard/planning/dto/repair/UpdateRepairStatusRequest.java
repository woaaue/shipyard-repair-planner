package com.shipyard.planning.dto.repair;

import com.shipyard.planning.model.RepairStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateRepairStatusRequest(
        @NotNull RepairStatus status
) {
}
