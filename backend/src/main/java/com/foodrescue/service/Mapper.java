package com.foodrescue.service;

import com.foodrescue.dto.*;
import com.foodrescue.entity.*;

import java.time.Instant;

/** Entity to DTO conversion. Call inside a transaction so lazy associations can load. */
public final class Mapper {

    private Mapper() {
    }

    public static DonationResponse donation(Donation d, Instant now, Double distanceKm, MatchResult match, Pickup activePickup) {
        return donation(d, now, distanceKm, match, activePickup, null, 0);
    }

    public static DonationResponse donation(Donation d, Instant now, Double distanceKm, MatchResult match, Pickup activePickup,
                                            MatchRequestRef myRequest, int pendingRequests) {
        DonationStatus status = d.effectiveStatus(now);
        long minutesLeft = d.minutesToExpiry(now);
        Urgency urgency = status.isFinal() ? null : Urgency.fromMinutesLeft(minutesLeft);
        PickupSummary pickup = activePickup == null ? null
                : new PickupSummary(activePickup.getId(), activePickup.getStatus(),
                PersonSummary.from(activePickup.getCollector()), activePickup.getClaimedAt());
        return new DonationResponse(
                d.getId(), d.getFoodName(), d.getCategory(), d.getDietary(), d.getQuantityDescription(),
                d.getServings(), d.getDescription(), d.getImageUrl(), d.getPickupAddress(),
                d.getPickupLat(), d.getPickupLng(), d.getPickupDeadline(), d.getExpiryTime(),
                d.getPreparedAt(), d.isRequiresRefrigeration(), status, minutesLeft, urgency, distanceKm, match, PersonSummary.from(d.getDonor()), pickup,
                myRequest, pendingRequests, d.getCreatedAt());
    }

    public static PickupResponse pickup(Pickup p) {
        Donation d = p.getDonation();
        LocationPoint last = p.getLastLat() == null ? null
                : new LocationPoint(p.getLastLat(), p.getLastLng(), p.getLastLocationAt());
        return new PickupResponse(
                p.getId(), d.getId(), d.getFoodName(), d.getServings(), d.getPickupAddress(),
                d.getPickupLat(), d.getPickupLng(), d.getExpiryTime(), d.isRequiresRefrigeration(),
                p.getStatus(), p.getStatus().nextStatuses(),
                ContactSummary.from(p.getCollector()), ContactSummary.from(d.getDonor()),
                p.isSharingLocation(), last,
                p.getClaimedAt(), p.getArrivedAt(), p.getPickedUpAt(), p.getInTransitAt(),
                p.getDeliveredAt(), p.getCancelledAt());
    }

    public static MatchRequestRef ref(MatchRequest r, Instant now) {
        return r == null ? null : new MatchRequestRef(r.getId(), r.getDirection(), MatchRequestService.effectiveStatus(r, now));
    }

    public static LocationPoint point(LocationUpdate u) {
        return new LocationPoint(u.getLatitude(), u.getLongitude(), u.getRecordedAt());
    }
}
