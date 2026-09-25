package com.foodrescue.dto;

import java.util.List;

public record MatchResult(int score, Double distanceKm, long minutesToExpiry, List<ScoreComponent> breakdown, String reason) {
}
