package com.shipyard.notification.dto;

import java.time.LocalDateTime;

public record NotificationResponse(
        long id,
        String type,
        String title,
        String message,
        boolean read,
        Long userId,
        LocalDateTime createdAt
) {
}
