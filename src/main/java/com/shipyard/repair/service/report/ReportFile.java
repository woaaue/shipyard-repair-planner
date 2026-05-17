package com.shipyard.repair.service.report;

public record ReportFile(byte[] bytes, String fileName, String contentType) {
}
