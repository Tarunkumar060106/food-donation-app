package com.foodrescue.entity;

public enum DonationStatus {
    AVAILABLE, CLAIMED, PICKED_UP, IN_TRANSIT, DELIVERED, EXPIRED, CANCELLED;

    public boolean isFinal() {
        return this == DELIVERED || this == EXPIRED || this == CANCELLED;
    }
}
