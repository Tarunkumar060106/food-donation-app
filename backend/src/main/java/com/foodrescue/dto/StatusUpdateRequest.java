package com.foodrescue.dto;

import com.foodrescue.entity.PickupStatus;
import jakarta.validation.constraints.NotNull;

public record StatusUpdateRequest(@NotNull PickupStatus status) {
}
