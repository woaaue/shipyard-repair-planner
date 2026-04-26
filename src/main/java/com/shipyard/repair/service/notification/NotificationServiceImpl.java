package com.shipyard.repair.service.notification;

import com.shipyard.repair.dto.notification.NotificationResponse;
import com.shipyard.repair.entity.Notification;
import com.shipyard.repair.entity.User;
import com.shipyard.repair.exception.BadRequestException;
import com.shipyard.repair.exception.ErrorCode;
import com.shipyard.repair.repository.NotificationRepository;
import com.shipyard.repair.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Override
    public List<NotificationResponse> getNotifications(boolean unreadOnly) {
        Integer userId = resolveCurrentUserId();
        return notificationRepository.findVisibleForUser(userId, unreadOnly).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public NotificationResponse markAsRead(Integer id) {
        if (id == null) {
            throw new BadRequestException(ErrorCode.ID_IS_NULL);
        }
        Integer userId = resolveCurrentUserId();
        Notification notification = notificationRepository.findVisibleById(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        notification.setRead(true);
        Notification saved = notificationRepository.save(notification);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public List<NotificationResponse> markAllAsRead() {
        Integer userId = resolveCurrentUserId();
        List<Notification> notifications = notificationRepository.findVisibleForUser(userId, true);
        notifications.forEach(notification -> notification.setRead(true));
        return notificationRepository.saveAll(notifications).stream()
                .map(this::toResponse)
                .toList();
    }

    private Integer resolveCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            throw new IllegalArgumentException("Unauthorized");
        }
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return user.getId();
    }

    private NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getType(),
                notification.getTitle(),
                notification.getMessage(),
                notification.isRead(),
                notification.getUser() == null ? null : notification.getUser().getId(),
                notification.getCreatedAt()
        );
    }
}
