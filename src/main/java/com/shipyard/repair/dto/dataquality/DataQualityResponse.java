package com.shipyard.repair.dto.dataquality;

import java.time.LocalDateTime;
import java.util.List;

public record DataQualityResponse(
        int withoutSupervisorCount,
        int withoutDockCount,
        int invalidHierarchyCount,
        int duplicateEmailGroupsCount,
        List<DataQualityUserIssueResponse> withoutSupervisorUsers,
        List<DataQualityUserIssueResponse> withoutDockUsers,
        List<DataQualityUserIssueResponse> invalidHierarchyUsers,
        List<DuplicateEmailGroupResponse> duplicateEmailGroups,
        LocalDateTime generatedAt
) {
}

