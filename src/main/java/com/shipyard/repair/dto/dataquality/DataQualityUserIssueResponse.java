package com.shipyard.repair.dto.dataquality;

public record DataQualityUserIssueResponse(
        Integer userId,
        String fullName,
        String email,
        String role,
        String dockName,
        Integer reportsToUserId,
        String reportsToFullName,
        String expectedSupervisorRole,
        String actualSupervisorRole
) {
}

