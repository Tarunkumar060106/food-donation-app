package com.foodrescue.dto;

import com.foodrescue.entity.PickupStatus;

import java.time.Instant;
import java.util.UUID;

public record PickupSummary(UUID id, PickupStatus status, PersonSummary collector, Instant claimedAt) {
}
