package com.shipyard.planning.dto.repairrequest;

import com.shipyard.planning.model.RepairRequestStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateRepairRequestStatusRequest(
        @NotNull RepairRequestStatus status
) {
}
