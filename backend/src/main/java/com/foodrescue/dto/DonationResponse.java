package com.foodrescue.dto;

import com.foodrescue.entity.Dietary;
import com.foodrescue.entity.DonationStatus;
import com.foodrescue.entity.FoodCategory;

import java.time.Instant;
import java.util.UUID;

/**
 * @param myRequest       for collectors: their latest request or offer on this donation
 * @param pendingRequests for the donor: collector requests waiting for an answer
 */
public record DonationResponse(
        UUID id,
        String foodName,
        FoodCategory category,
        Dietary dietary,
        String quantityDescription,
        int servings,
        String description,
        String imageUrl,
        String pickupAddress,
        double pickupLat,
        double pickupLng,
        Instant pickupDeadline,
        Instant expiryTime,
        Instant preparedAt,
        boolean requiresRefrigeration,
        DonationStatus status,
        long minutesToExpiry,
        Urgency urgency,
        Double distanceKm,
        MatchResult match,
        PersonSummary donor,
        PickupSummary activePickup,
        MatchRequestRef myRequest,
        int pendingRequests,
        Instant createdAt
) {
}
