package com.shipyard.repair.dto.repairrequest;

import jakarta.validation.constraints.Size;

public record UpdateRepairRequestResubmitRequest(
        @Size(max = 500)
        String note
) {
}
