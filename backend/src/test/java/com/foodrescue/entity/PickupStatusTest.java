package com.foodrescue.entity;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.time.Duration;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class PickupStatusTest {

    @ParameterizedTest
    @CsvSource({
            "CLAIMED, ARRIVED, true",
            "CLAIMED, CANCELLED, true",
            "ARRIVED, PICKED_UP, true",
            "PICKED_UP, IN_TRANSIT, true",
            "IN_TRANSIT, DELIVERED, true",
            "CLAIMED, DELIVERED, false",
            "CLAIMED, PICKED_UP, false",
            "PICKED_UP, CANCELLED, false",
            "DELIVERED, CANCELLED, false",
            "CANCELLED, CLAIMED, false",
            "IN_TRANSIT, ARRIVED, false"
    })
    void onlyForwardStepsAndEarlyCancelAreAllowed(PickupStatus from, PickupStatus to, boolean allowed) {
        assertThat(from.canTransitionTo(to)).isEqualTo(allowed);
    }

    @Test
    void donationStatusMirrorsPickup() {
        assertThat(PickupStatus.ARRIVED.toDonationStatus()).isEqualTo(DonationStatus.CLAIMED);
        assertThat(PickupStatus.IN_TRANSIT.toDonationStatus()).isEqualTo(DonationStatus.IN_TRANSIT);
        assertThat(PickupStatus.DELIVERED.toDonationStatus()).isEqualTo(DonationStatus.DELIVERED);
        assertThat(PickupStatus.CANCELLED.toDonationStatus()).isNull();
    }

    @Test
    void finishingAPickupStopsLocationSharingAndStampsTime() {
        Instant t = Instant.parse("2026-09-26T12:00:00Z");
        User donor = new User("D", "d@example.com", "x", Role.DONOR);
        Donation d = new Donation(donor, "Rice", FoodCategory.COOKED_MEAL, Dietary.VEG, null, 10, null, null,
                "Addr", 13.0, 80.0, t.plus(Duration.ofHours(1)), t.plus(Duration.ofHours(2)));
        Pickup p = new Pickup(d, new User("C", "c@example.com", "x", Role.VOLUNTEER), t);
        p.setSharingLocation(true);

        p.moveTo(PickupStatus.CANCELLED, t);

        assertThat(p.isSharingLocation()).isFalse();
        assertThat(p.getCancelledAt()).isEqualTo(t);
    }

    @Test
    void uncollectedDonationReadsAsExpiredOncePastExpiry() {
        Instant t = Instant.parse("2026-09-26T12:00:00Z");
        User donor = new User("D", "d@example.com", "x", Role.DONOR);
        Donation d = new Donation(donor, "Rice", FoodCategory.COOKED_MEAL, Dietary.VEG, null, 10, null, null,
                "Addr", 13.0, 80.0, t.plus(Duration.ofMinutes(30)), t.plus(Duration.ofHours(1)));

        assertThat(d.effectiveStatus(t)).isEqualTo(DonationStatus.AVAILABLE);
        assertThat(d.effectiveStatus(t.plus(Duration.ofHours(2)))).isEqualTo(DonationStatus.EXPIRED);

        d.setStatus(DonationStatus.IN_TRANSIT);
        assertThat(d.effectiveStatus(t.plus(Duration.ofHours(2)))).isEqualTo(DonationStatus.IN_TRANSIT);
    }
}
