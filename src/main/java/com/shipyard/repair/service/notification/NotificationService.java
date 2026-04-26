package com.shipyard.repair.service.notification;

import com.shipyard.repair.dto.notification.NotificationResponse;

import java.util.List;

public interface NotificationService {

    List<NotificationResponse> getNotifications(boolean unreadOnly);

    NotificationResponse markAsRead(Integer id);

    List<NotificationResponse> markAllAsRead();
}
