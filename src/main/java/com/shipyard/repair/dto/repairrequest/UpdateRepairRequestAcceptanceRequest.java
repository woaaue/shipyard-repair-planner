package com.shipyard.repair.dto.repairrequest;

import jakarta.validation.constraints.Size;

public record UpdateRepairRequestAcceptanceRequest(
        @Size(max = 500)
        String note
) {
}

