package com.foodrescue.service;

import com.foodrescue.dto.MatchResult;
import com.foodrescue.dto.ScoreComponent;
import com.foodrescue.entity.*;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;

class MatchingServiceTest {

    private final MatchingService matching = new MatchingService();
    private final Instant now = Instant.parse("2026-09-26T12:00:00Z");

    private Donation donation(Dietary dietary, int servings, int minutesToExpiry) {
        User donor = new User("Donor", "d@example.com", "x", Role.DONOR);
        return new Donation(donor, "Biryani", FoodCategory.COOKED_MEAL, dietary, null, servings, null, null,
                "Anna Nagar", 13.0850, 80.2101, now.plus(Duration.ofMinutes(minutesToExpiry - 10)),
                now.plus(Duration.ofMinutes(minutesToExpiry)));
    }

    private User collector(Double lat, Double lng, Integer capacity, boolean acceptsNonVeg) {
        User u = new User("Arjun", "a@example.com", "x", Role.VOLUNTEER);
        u.setLocation(lat, lng);
        u.setCapacityServings(capacity);
        u.setAcceptsNonVeg(acceptsNonVeg);
        return u;
    }

    @Test
    void perfectMatchScoresFullMarks() {
        MatchResult r = matching.score(donation(Dietary.VEG, 50, 15), collector(13.0850, 80.2101, 100, true), now);

        assertThat(r.score()).isEqualTo(100);
        assertThat(r.distanceKm()).isEqualTo(0.0);
        assertThat(r.reason()).isEqualTo("100% match, 0.0 km away, capacity available, expires in 15 min");
    }

    @Test
    void partsAddUpToTheTotalAndRespectWeights() {
        MatchResult r = matching.score(donation(Dietary.VEG, 80, 42), collector(13.0780, 80.2180, 40, true), now);

        double sum = r.breakdown().stream().mapToDouble(ScoreComponent::points).sum();
        assertThat(sum).isCloseTo(r.score(), org.assertj.core.data.Offset.offset(1.0));
        assertThat(r.breakdown()).extracting(ScoreComponent::weight).containsExactly(40, 30, 20, 10);
        assertThat(r.breakdown().get(2).points()).isEqualTo(10.0);
        assertThat(r.reason()).contains("can take 40 of 80 servings");
    }

    @Test
    void moreUrgentDonationsScoreHigher() {
        User c = collector(13.08, 80.22, 100, true);
        int urgent = matching.score(donation(Dietary.VEG, 50, 20), c, now).score();
        int relaxed = matching.score(donation(Dietary.VEG, 50, 600), c, now).score();

        assertThat(urgent).isGreaterThan(relaxed);
    }

    @Test
    void nonVegForVegOnlyCollectorLosesFoodPoints() {
        MatchResult r = matching.score(donation(Dietary.NON_VEG, 50, 60), collector(13.0850, 80.2101, 100, false), now);

        assertThat(r.breakdown().get(3).points()).isZero();
        assertThat(r.reason()).contains("does not accept non-veg");
    }

    @Test
    void collectorWithoutLocationGetsNoDistancePoints() {
        MatchResult r = matching.score(donation(Dietary.VEG, 50, 60), collector(null, null, null, true), now);

        assertThat(r.distanceKm()).isNull();
        assertThat(r.breakdown().get(1).points()).isZero();
        assertThat(r.breakdown().get(2).points()).isEqualTo(10.0);
        assertThat(r.reason()).contains("capacity not set");
    }

    @Test
    void refrigeratedFoodPrefersCollectorsWithACoolBox() {
        Donation cold = donation(Dietary.VEG, 50, 60);
        cold.setRequiresRefrigeration(true);
        User withBox = collector(13.0850, 80.2101, 100, true);
        withBox.setHasCoolBox(true);
        User withoutBox = collector(13.0850, 80.2101, 100, true);

        MatchResult good = matching.score(cold, withBox, now);
        MatchResult weak = matching.score(cold, withoutBox, now);

        assertThat(good.breakdown().get(3).points()).isEqualTo(10.0);
        assertThat(good.reason()).contains("has a cool box");
        assertThat(weak.breakdown().get(3).points()).isEqualTo(2.5);
        assertThat(weak.reason()).contains("no cool box for refrigerated food");
        assertThat(good.score()).isGreaterThan(weak.score());
    }

    @Test
    void coolBoxIsIrrelevantForFoodThatNeedsNoFridge() {
        MatchResult r = matching.score(donation(Dietary.VEG, 50, 60), collector(13.0850, 80.2101, 100, true), now);

        assertThat(r.breakdown().get(3).points()).isEqualTo(10.0);
        assertThat(r.reason()).doesNotContain("cool box");
    }

    @Test
    void homeOpenNowIsDeliverableAndSaysSo() {
        User home = collector(13.0850, 80.2101, 100, true);
        home.setOpeningHours(LocalTime.of(0, 0), LocalTime.of(23, 59));

        MatchResult r = matching.score(donation(Dietary.VEG, 50, 60), home, now);

        assertThat(r.deliverable()).isTrue();
        assertThat(r.hoursNote()).isEqualTo("Open now, 00:00–23:59");
        assertThat(r.reason()).endsWith("open now (00:00–23:59)");
    }

    @Test
    void homeClosedUntilAfterExpiryIsNotDeliverable() {
        // now is 17:30 IST; the food expires at 18:30 and the home only opens at 20:00.
        User home = collector(13.0850, 80.2101, 100, true);
        home.setOpeningHours(LocalTime.of(20, 0), LocalTime.of(23, 0));

        MatchResult r = matching.score(donation(Dietary.VEG, 50, 60), home, now);

        assertThat(r.deliverable()).isFalse();
        assertThat(r.reason()).contains("closed until after the food expires");
    }

    @Test
    void homeOpeningBeforeExpiryIsStillDeliverable() {
        User home = collector(13.0850, 80.2101, 100, true);
        home.setOpeningHours(LocalTime.of(18, 0), LocalTime.of(22, 0));

        MatchResult r = matching.score(donation(Dietary.VEG, 50, 120), home, now);

        assertThat(r.deliverable()).isTrue();
        assertThat(r.hoursNote()).isEqualTo("Opens at 18:00, 18:00–22:00");
    }

    @Test
    void collectorsWithoutHoursAreAlwaysDeliverable() {
        MatchResult r = matching.score(donation(Dietary.VEG, 50, 60), collector(13.0850, 80.2101, 100, true), now);

        assertThat(r.deliverable()).isTrue();
        assertThat(r.hoursNote()).isNull();
    }

    @Test
    void formatsLongDurations() {
        assertThat(MatchingService.formatMinutes(42)).isEqualTo("42 min");
        assertThat(MatchingService.formatMinutes(120)).isEqualTo("2 h");
        assertThat(MatchingService.formatMinutes(135)).isEqualTo("2 h 15 min");
    }
}
