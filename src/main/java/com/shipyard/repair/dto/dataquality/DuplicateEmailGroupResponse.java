package com.shipyard.repair.dto.dataquality;

import java.util.List;

public record DuplicateEmailGroupResponse(
        String email,
        int usersCount,
        List<DataQualityUserIssueResponse> users
) {
}

