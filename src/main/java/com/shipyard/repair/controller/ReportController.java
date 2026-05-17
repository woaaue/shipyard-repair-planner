package com.shipyard.repair.controller;

import com.shipyard.repair.service.report.ReportFile;
import com.shipyard.repair.service.report.ReportPeriod;
import com.shipyard.repair.service.report.ReportScope;
import com.shipyard.repair.service.report.ReportService;
import com.shipyard.repair.service.report.ReportSummary;
import com.shipyard.repair.service.report.ReportType;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/summary")
    public ResponseEntity<ReportSummary> summary(
            Authentication authentication,
            @RequestParam ReportType type,
            @RequestParam ReportPeriod period,
            @RequestParam(defaultValue = "SELF") ReportScope scope,
            @RequestParam(required = false) Integer scopeUserId,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate
    ) {
        return ResponseEntity.status(HttpStatus.OK).body(
                reportService.getReportSummary(
                        authentication.getName(),
                        type,
                        period,
                        scope,
                        scopeUserId,
                        fromDate,
                        toDate
                )
        );
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> export(
            Authentication authentication,
            @RequestParam ReportType type,
            @RequestParam ReportPeriod period,
            @RequestParam(defaultValue = "SELF") ReportScope scope,
            @RequestParam(required = false) Integer scopeUserId,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate,
            @RequestParam(defaultValue = "xlsx") String format
    ) {
        ReportFile reportFile = reportService.exportReport(
                authentication.getName(),
                type,
                period,
                scope,
                scopeUserId,
                fromDate,
                toDate,
                format
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(reportFile.contentType()));
        headers.setContentDisposition(
                ContentDisposition.attachment().filename(reportFile.fileName()).build()
        );
        return ResponseEntity.status(HttpStatus.OK)
                .headers(headers)
                .body(reportFile.bytes());
    }
}
