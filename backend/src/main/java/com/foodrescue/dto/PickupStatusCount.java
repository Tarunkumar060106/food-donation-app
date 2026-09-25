package com.foodrescue.dto;

import com.foodrescue.entity.PickupStatus;

public record PickupStatusCount(PickupStatus status, Long count, Long servings) {
}
