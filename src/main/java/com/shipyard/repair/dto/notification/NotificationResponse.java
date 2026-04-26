package com.shipyard.repair.dto.notification;

import com.shipyard.repair.enums.NotificationType;

import java.time.LocalDateTime;

public record NotificationResponse(
        int id,
        NotificationType type,
        String title,
        String message,
        boolean read,
        Integer userId,
        LocalDateTime createdAt
) {
}
