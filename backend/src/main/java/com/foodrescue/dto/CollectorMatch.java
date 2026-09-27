package com.foodrescue.dto;

/** @param pendingOffer the open request or offer between this donation and collector, if any */
public record CollectorMatch(PersonSummary collector, Integer capacityServings, MatchResult match, MatchRequestRef pendingOffer) {
}
