package com.foodrescue.entity;

import java.util.Map;
import java.util.Set;

public enum PickupStatus {
    CLAIMED, ARRIVED, PICKED_UP, IN_TRANSIT, DELIVERED, CANCELLED;

    private static final Map<PickupStatus, Set<PickupStatus>> ALLOWED = Map.of(
            CLAIMED, Set.of(ARRIVED, CANCELLED),
            ARRIVED, Set.of(PICKED_UP, CANCELLED),
            PICKED_UP, Set.of(IN_TRANSIT),
            IN_TRANSIT, Set.of(DELIVERED),
            DELIVERED, Set.of(),
            CANCELLED, Set.of()
    );

    public boolean canTransitionTo(PickupStatus next) {
        return ALLOWED.get(this).contains(next);
    }

    public Set<PickupStatus> nextStatuses() {
        return ALLOWED.get(this);
    }

    public boolean isActive() {
        return this != DELIVERED && this != CANCELLED;
    }

    /** The donation status that mirrors this pickup status, or null when it must be decided elsewhere. */
    public DonationStatus toDonationStatus() {
        return switch (this) {
            case CLAIMED, ARRIVED -> DonationStatus.CLAIMED;
            case PICKED_UP -> DonationStatus.PICKED_UP;
            case IN_TRANSIT -> DonationStatus.IN_TRANSIT;
            case DELIVERED -> DonationStatus.DELIVERED;
            case CANCELLED -> null;
        };
    }
}
