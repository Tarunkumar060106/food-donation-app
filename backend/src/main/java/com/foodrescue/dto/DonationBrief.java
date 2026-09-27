package com.foodrescue.dto;

import com.foodrescue.entity.DonationStatus;

import java.time.Instant;
import java.util.UUID;

public record DonationBrief(UUID id, String foodName, int servings, DonationStatus status, Instant pickupDeadline,
                            Instant expiryTime, String pickupAddress, boolean requiresRefrigeration, String imageUrl) {
}
