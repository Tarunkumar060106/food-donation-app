package com.foodrescue.service;

import com.foodrescue.dto.NotificationResponse;
import com.foodrescue.dto.NotificationsResponse;
import com.foodrescue.entity.Notification;
import com.foodrescue.entity.NotificationType;
import com.foodrescue.entity.User;
import com.foodrescue.exception.ApiException;
import com.foodrescue.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class NotificationService {

    private final NotificationRepository notifications;

    public NotificationService(NotificationRepository notifications) {
        this.notifications = notifications;
    }

    @Transactional
    public void notify(User user, NotificationType type, String title, String message) {
        notifications.save(new Notification(user, type, title, message));
    }

    @Transactional(readOnly = true)
    public NotificationsResponse list(UUID userId) {
        var items = notifications.findTop50ByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(NotificationResponse::from)
                .toList();
        return new NotificationsResponse(notifications.countByUserIdAndReadAtIsNull(userId), items);
    }

    @Transactional
    public NotificationResponse markRead(UUID id, UUID userId) {
        Notification n = notifications.findByIdAndUserId(id, userId)
                .orElseThrow(() -> ApiException.notFound("Notification"));
        n.markRead(Instant.now());
        return NotificationResponse.from(n);
    }

    @Transactional
    public int markAllRead(UUID userId) {
        return notifications.markAllRead(userId, Instant.now());
    }
}
