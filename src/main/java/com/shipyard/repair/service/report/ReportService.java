package com.shipyard.repair.service.report;

public interface ReportService {
    ReportSummary getReportSummary(
            String principalEmail,
            ReportType type,
            ReportPeriod period,
            ReportScope scope,
            Integer scopeUserId,
            String fromDate,
            String toDate
    );

    ReportFile exportReport(
            String principalEmail,
            ReportType type,
            ReportPeriod period,
            ReportScope scope,
            Integer scopeUserId,
            String fromDate,
            String toDate,
            String format
    );
}
