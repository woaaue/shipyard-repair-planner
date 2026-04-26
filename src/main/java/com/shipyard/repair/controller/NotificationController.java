package com.shipyard.repair.controller;

import com.shipyard.repair.dto.notification.NotificationResponse;
import com.shipyard.repair.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getNotifications(
            @RequestParam(defaultValue = "false") boolean unreadOnly
    ) {
        return ResponseEntity.status(HttpStatus.OK)
                .body(notificationService.getNotifications(unreadOnly));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markAsRead(@PathVariable Integer id) {
        return ResponseEntity.status(HttpStatus.OK)
                .body(notificationService.markAsRead(id));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<List<NotificationResponse>> markAllAsRead() {
        return ResponseEntity.status(HttpStatus.OK)
                .body(notificationService.markAllAsRead());
    }
}
