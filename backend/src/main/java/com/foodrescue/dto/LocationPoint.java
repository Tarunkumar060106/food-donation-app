package com.foodrescue.dto;

import java.time.Instant;

public record LocationPoint(double lat, double lng, Instant recordedAt) {
}
