package com.foodrescue.dto;

import java.util.List;

public record NotificationsResponse(long unreadCount, List<NotificationResponse> items) {
}
