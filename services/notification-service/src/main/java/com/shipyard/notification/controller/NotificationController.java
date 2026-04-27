package com.shipyard.notification.controller;

import com.shipyard.notification.dto.NotificationResponse;
import com.shipyard.notification.service.NotificationStore;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationStore notificationStore;

    public NotificationController(NotificationStore notificationStore) {
        this.notificationStore = notificationStore;
    }

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getNotifications(
            @RequestParam(defaultValue = "false") boolean unreadOnly
    ) {
        return ResponseEntity.ok(notificationStore.getNotifications(unreadOnly));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markAsRead(@PathVariable long id) {
        return ResponseEntity.ok(notificationStore.markAsRead(id));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<List<NotificationResponse>> markAllAsRead() {
        return ResponseEntity.ok(notificationStore.markAllAsRead());
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "ok"));
    }
}
