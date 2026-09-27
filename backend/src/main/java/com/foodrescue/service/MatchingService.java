package com.foodrescue.service;

import com.foodrescue.dto.MatchResult;
import com.foodrescue.dto.ScoreComponent;
import com.foodrescue.entity.Dietary;
import com.foodrescue.entity.Donation;
import com.foodrescue.entity.User;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Transparent weighted score (PRD section 7): urgency 40, distance 30, capacity 20, food fit 10.
 * Food fit covers dietary compatibility and, for refrigerated food, whether the collector has a cool box.
 * Each signal is normalised to 0..1 and multiplied by its weight, so the parts add up to the total.
 */
@Service
public class MatchingService {

    static final int URGENCY_WEIGHT = 40;
    static final int DISTANCE_WEIGHT = 30;
    static final int CAPACITY_WEIGHT = 20;
    static final int FOOD_WEIGHT = 10;

    static final long MOST_URGENT_MINUTES = 15;
    static final long RELAXED_MINUTES = 240;
    static final double NEAR_KM = 0.5;
    static final double FAR_KM = 10.0;

    /** Used when a collector has not set a capacity: neither rewarded nor excluded. */
    static final double UNKNOWN_CAPACITY_SCORE = 0.5;

    /** Refrigerated food with a collector who can't keep it cold: still allowed, but ranked well below one who can. */
    static final double NO_COOL_BOX_FOOD_SCORE = 0.25;

    public MatchResult score(Donation donation, User collector, Instant now) {
        long minutesLeft = donation.minutesToExpiry(now);
        double urgency = clamp01(1 - (double) (minutesLeft - MOST_URGENT_MINUTES) / (RELAXED_MINUTES - MOST_URGENT_MINUTES));

        Double km = collector.hasLocation()
                ? Geo.distanceKm(donation.getPickupLat(), donation.getPickupLng(), collector.getLatitude(), collector.getLongitude())
                : null;
        double distance = km == null ? 0 : clamp01(1 - (km - NEAR_KM) / (FAR_KM - NEAR_KM));

        Integer capacityServings = collector.getCapacityServings();
        double capacity = capacityServings == null
                ? UNKNOWN_CAPACITY_SCORE
                : Math.min(1.0, (double) capacityServings / donation.getServings());

        boolean foodCompatible = donation.getDietary() == Dietary.VEG || collector.isAcceptsNonVeg();
        boolean needsCold = donation.isRequiresRefrigeration();
        boolean keepsCold = !needsCold || collector.isHasCoolBox();
        double food = !foodCompatible ? 0 : keepsCold ? 1 : NO_COOL_BOX_FOOD_SCORE;

        List<ScoreComponent> parts = List.of(
                new ScoreComponent("urgency", URGENCY_WEIGHT, Geo.round1(URGENCY_WEIGHT * urgency)),
                new ScoreComponent("distance", DISTANCE_WEIGHT, Geo.round1(DISTANCE_WEIGHT * distance)),
                new ScoreComponent("capacity", CAPACITY_WEIGHT, Geo.round1(CAPACITY_WEIGHT * capacity)),
                new ScoreComponent("food", FOOD_WEIGHT, Geo.round1(FOOD_WEIGHT * food)));

        double raw = URGENCY_WEIGHT * urgency + DISTANCE_WEIGHT * distance + CAPACITY_WEIGHT * capacity + FOOD_WEIGHT * food;
        int total = (int) Math.round(raw);

        List<String> reasons = new ArrayList<>();
        reasons.add(total + "% match");
        if (km != null) {
            reasons.add(String.format(Locale.ROOT, "%.1f km away", km));
        }
        if (capacityServings == null) {
            reasons.add("capacity not set");
        } else if (capacity >= 1) {
            reasons.add("capacity available");
        } else {
            reasons.add("can take " + capacityServings + " of " + donation.getServings() + " servings");
        }
        if (!foodCompatible) {
            reasons.add("does not accept non-veg");
        } else if (needsCold) {
            reasons.add(keepsCold ? "has a cool box" : "no cool box for refrigerated food");
        }
        reasons.add("expires in " + formatMinutes(minutesLeft));

        return new MatchResult(total, km == null ? null : Geo.round1(km), minutesLeft, parts, String.join(", ", reasons));
    }

    static String formatMinutes(long minutes) {
        if (minutes < 60) return minutes + " min";
        long h = minutes / 60;
        long m = minutes % 60;
        return m == 0 ? h + " h" : h + " h " + m + " min";
    }

    private static double clamp01(double v) {
        return Math.max(0, Math.min(1, v));
    }
}
