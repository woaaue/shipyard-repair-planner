package com.shipyard.repair.service.report;

public record ReportSummary(
        long total,
        long inProgress,
        long completed,
        long planned
) {
}

