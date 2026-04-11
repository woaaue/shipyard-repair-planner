package com.shipyard.repair.exception;

public record ErrorResponse(
        String message,
        String errorCode,
        long timestamp
) {
}
