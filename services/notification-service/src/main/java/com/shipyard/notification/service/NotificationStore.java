package com.shipyard.notification.service;

import com.shipyard.notification.dto.NotificationResponse;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Collectors;

@Service
public class NotificationStore {

    private final CopyOnWriteArrayList<NotificationResponse> notifications = new CopyOnWriteArrayList<>();

    @PostConstruct
    void init() {
        notifications.add(new NotificationResponse(
                1L,
                "INFO",
                "System started",
                "Notification service is running",
                false,
                1L,
                LocalDateTime.now().minusMinutes(20)
        ));
        notifications.add(new NotificationResponse(
                2L,
                "WARNING",
                "Dock delay",
                "Dock #2 reported downtime",
                false,
                2L,
                LocalDateTime.now().minusMinutes(10)
        ));
    }

    public List<NotificationResponse> getNotifications(boolean unreadOnly) {
        if (!unreadOnly) {
            return new ArrayList<>(notifications);
        }
        return notifications.stream()
                .filter(notification -> !notification.read())
                .collect(Collectors.toList());
    }

    public NotificationResponse markAsRead(long id) {
        for (int i = 0; i < notifications.size(); i++) {
            NotificationResponse current = notifications.get(i);
            if (current.id() == id) {
                NotificationResponse updated = new NotificationResponse(
                        current.id(),
                        current.type(),
                        current.title(),
                        current.message(),
                        true,
                        current.userId(),
                        current.createdAt()
                );
                notifications.set(i, updated);
                return updated;
            }
        }
        throw new IllegalArgumentException("Notification not found");
    }

    public List<NotificationResponse> markAllAsRead() {
        List<NotificationResponse> updated = notifications.stream()
                .map(current -> new NotificationResponse(
                        current.id(),
                        current.type(),
                        current.title(),
                        current.message(),
                        true,
                        current.userId(),
                        current.createdAt()
                ))
                .toList();
        notifications.clear();
        notifications.addAll(updated);
        return updated;
    }
}
