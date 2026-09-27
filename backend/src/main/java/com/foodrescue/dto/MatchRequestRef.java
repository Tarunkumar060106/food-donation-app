package com.foodrescue.dto;

import com.foodrescue.entity.MatchDirection;
import com.foodrescue.entity.MatchRequestStatus;

import java.util.UUID;

/** The caller's latest request or offer on a donation, shown on feed cards and the donation page. */
public record MatchRequestRef(UUID id, MatchDirection direction, MatchRequestStatus status) {
}
