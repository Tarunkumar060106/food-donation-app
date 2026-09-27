package com.foodrescue.dto;

import java.util.List;

/**
 * @param deliverable false when the collector's home or centre is closed from the earliest arrival until expiry
 * @param hoursNote   opening-hours summary for collectors with hours set, e.g. "Open now, 09:00–21:00"
 */
public record MatchResult(int score, Double distanceKm, long minutesToExpiry, List<ScoreComponent> breakdown, String reason,
                          boolean deliverable, String hoursNote) {
}
