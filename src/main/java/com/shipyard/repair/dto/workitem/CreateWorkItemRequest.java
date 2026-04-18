package com.shipyard.repair.dto.workitem;

import com.shipyard.repair.enums.WorkCategory;
import com.shipyard.repair.enums.WorkItemStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateWorkItemRequest(
        @NotNull(message = "{repairRequest.not.found}")
        Integer repairRequestId,

        Integer repairId,

        @NotNull(message = "Category is required")
        WorkCategory category,

        @NotBlank(message = "Name is required")
        @Size(max = 200, message = "Name max length is 200")
        String name,

        @Size(max = 1000, message = "Description max length is 1000")
        String description,

        WorkItemStatus status,

        @Min(value = 0, message = "Estimated hours must be >= 0")
        Integer estimatedHours,

        @Min(value = 0, message = "Actual hours must be >= 0")
        Integer actualHours,

        Boolean isMandatory,
        Boolean isDiscovered,

        @Size(max = 500, message = "Notes max length is 500")
        String notes
) {
}
