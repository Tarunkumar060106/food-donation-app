package com.foodrescue.dto;

import com.foodrescue.entity.MatchDirection;
import com.foodrescue.entity.MatchRequestStatus;

import java.time.Instant;
import java.util.UUID;

/**
 * @param awaitingMe true when the caller is the one who has to accept or decline
 * @param sentByMe   true when the caller started it and can withdraw it
 * @param match      how well the collector fits this donation, so the donor can judge a request
 */
public record MatchRequestResponse(
        UUID id,
        MatchDirection direction,
        MatchRequestStatus status,
        String message,
        DonationBrief donation,
        PersonSummary collector,
        PersonSummary donor,
        Integer collectorCapacity,
        MatchResult match,
        boolean awaitingMe,
        boolean sentByMe,
        UUID pickupId,
        Instant createdAt,
        Instant respondedAt
) {
}
