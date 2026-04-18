package com.shipyard.repair.dto.repairrequest;

import com.shipyard.repair.enums.RepairRequestStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateRepairRequestStatusRequest(
        @NotNull(message = "Status is required")
        RepairRequestStatus status
) {
}
