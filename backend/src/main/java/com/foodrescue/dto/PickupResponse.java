package com.foodrescue.dto;

import com.foodrescue.entity.PickupStatus;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public record PickupResponse(
        UUID id,
        UUID donationId,
        String foodName,
        int servings,
        String pickupAddress,
        double pickupLat,
        double pickupLng,
        Instant expiryTime,
        PickupStatus status,
        Set<PickupStatus> nextStatuses,
        ContactSummary collector,
        ContactSummary donor,
        boolean sharingLocation,
        LocationPoint lastLocation,
        Instant claimedAt,
        Instant arrivedAt,
        Instant pickedUpAt,
        Instant inTransitAt,
        Instant deliveredAt,
        Instant cancelledAt
) {
}
