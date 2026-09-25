package com.foodrescue.dto;

import com.foodrescue.entity.Notification;
import com.foodrescue.entity.NotificationType;

import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(UUID id, NotificationType type, String title, String message, Instant readAt, Instant createdAt) {

    public static NotificationResponse from(Notification n) {
        return new NotificationResponse(n.getId(), n.getType(), n.getTitle(), n.getMessage(), n.getReadAt(), n.getCreatedAt());
    }
}
