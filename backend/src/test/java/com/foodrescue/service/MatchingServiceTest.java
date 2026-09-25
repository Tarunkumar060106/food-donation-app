package com.foodrescue.service;

import com.foodrescue.dto.MatchResult;
import com.foodrescue.dto.ScoreComponent;
import com.foodrescue.entity.*;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;

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
    void formatsLongDurations() {
        assertThat(MatchingService.formatMinutes(42)).isEqualTo("42 min");
        assertThat(MatchingService.formatMinutes(120)).isEqualTo("2 h");
        assertThat(MatchingService.formatMinutes(135)).isEqualTo("2 h 15 min");
    }
}
