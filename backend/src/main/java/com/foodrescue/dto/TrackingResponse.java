package com.foodrescue.dto;

import java.util.List;

public record TrackingResponse(PickupResponse pickup, List<LocationPoint> path) {
}
