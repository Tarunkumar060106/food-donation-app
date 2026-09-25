package com.foodrescue.service;

import com.foodrescue.dto.LocationPoint;
import com.foodrescue.dto.LocationRequest;
import com.foodrescue.dto.PickupResponse;
import com.foodrescue.dto.TrackingResponse;
import com.foodrescue.entity.*;
import com.foodrescue.exception.ApiException;
import com.foodrescue.repository.DonationRepository;
import com.foodrescue.repository.LocationUpdateRepository;
import com.foodrescue.repository.PickupRepository;
import com.foodrescue.repository.UserRepository;
import com.foodrescue.security.CurrentUser;
import com.foodrescue.service.TrackingStreamService.TrackingEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class PickupService {

    private final PickupRepository pickups;
    private final DonationRepository donations;
    private final UserRepository users;
    private final LocationUpdateRepository locations;
    private final NotificationService notifications;
    private final ApplicationEventPublisher events;

    public PickupService(PickupRepository pickups, DonationRepository donations, UserRepository users,
                         LocationUpdateRepository locations, NotificationService notifications,
                         ApplicationEventPublisher events) {
        this.pickups = pickups;
        this.donations = donations;
        this.users = users;
        this.locations = locations;
        this.notifications = notifications;
        this.events = events;
    }

    @Transactional
    public PickupResponse claim(CurrentUser caller, UUID donationId) {
        Instant now = Instant.now();
        if (donations.claimIfAvailable(donationId, now) == 0) {
            throw claimRejection(donationId, now);
        }
        Donation donation = donations.findById(donationId).orElseThrow(() -> ApiException.notFound("Donation"));
        User collector = users.findById(caller.id())
                .orElseThrow(() -> ApiException.unauthorized("This account no longer exists."));
        Pickup pickup = pickups.saveAndFlush(new Pickup(donation, collector, now));

        notifications.notify(donation.getDonor(), NotificationType.DONATION_CLAIMED,
                "Your donation was claimed",
                collector.getName() + " will collect \"" + donation.getFoodName() + "\".");
        return publish(pickup);
    }

    @Transactional
    public PickupResponse updateStatus(CurrentUser caller, UUID pickupId, PickupStatus next) {
        Instant now = Instant.now();
        Pickup pickup = find(pickupId);
        Donation donation = pickup.getDonation();
        boolean isCollector = pickup.getCollector().getId().equals(caller.id());

        if (!isCollector && !caller.isAdmin()) {
            throw ApiException.forbidden("Only the assigned collector can update this pickup.");
        }
        if (!isCollector && next != PickupStatus.CANCELLED) {
            throw ApiException.forbidden("Admins can cancel a pickup but not advance it.");
        }
        PickupStatus current = pickup.getStatus();
        if (current == next) {
            throw ApiException.invalidTransition("This pickup is already " + label(current) + ".");
        }
        if (!current.canTransitionTo(next)) {
            throw ApiException.invalidTransition("A pickup can't go from " + label(current) + " to " + label(next)
                    + ". Allowed next: " + (current.nextStatuses().isEmpty() ? "none" : current.nextStatuses()) + ".");
        }
        if (next == PickupStatus.PICKED_UP && !donation.getExpiryTime().isAfter(now)) {
            throw ApiException.conflict("This donation expired before it was picked up.");
        }

        pickup.moveTo(next, now);
        DonationStatus mirrored = next.toDonationStatus();
        donation.setStatus(mirrored != null ? mirrored : reopenedStatus(donation, now));

        notifyStatusChange(caller, pickup, next);
        return publish(pickup);
    }

    @Transactional
    public PickupResponse setSharing(CurrentUser caller, UUID pickupId, boolean enabled) {
        Pickup pickup = find(pickupId);
        requireCollector(caller, pickup);
        if (enabled && !pickup.getStatus().isActive()) {
            throw ApiException.conflict("Location sharing can only start on an active pickup.");
        }
        pickup.setSharingLocation(enabled);
        return publish(pickup);
    }

    @Transactional
    public LocationPoint recordLocation(CurrentUser caller, UUID pickupId, LocationRequest req) {
        Instant now = Instant.now();
        Pickup pickup = find(pickupId);
        requireCollector(caller, pickup);
        if (!pickup.getStatus().isActive()) {
            throw ApiException.conflict("This pickup is finished, so location is no longer shared.");
        }
        if (!pickup.isSharingLocation()) {
            throw ApiException.conflict("Start the trip before sharing your location.");
        }
        LocationUpdate update = locations.save(new LocationUpdate(pickup, req.lat(), req.lng(), now));
        pickup.recordLocation(req.lat(), req.lng(), now);

        LocationPoint point = Mapper.point(update);
        events.publishEvent(new TrackingEvent(pickup.getId(), "location", point));
        return point;
    }

    @Transactional(readOnly = true)
    public TrackingResponse tracking(CurrentUser caller, UUID pickupId) {
        Pickup pickup = find(pickupId);
        requireParticipant(caller, pickup);
        List<LocationPoint> path = new ArrayList<>(locations.findTop100ByPickupIdOrderByRecordedAtDesc(pickupId).stream()
                .map(Mapper::point)
                .toList());
        Collections.reverse(path);
        return new TrackingResponse(Mapper.pickup(pickup), path);
    }

    @Transactional(readOnly = true)
    public PickupResponse get(CurrentUser caller, UUID pickupId) {
        Pickup pickup = find(pickupId);
        requireParticipant(caller, pickup);
        return Mapper.pickup(pickup);
    }

    @Transactional(readOnly = true)
    public List<PickupResponse> list(CurrentUser caller, boolean activeOnly) {
        List<Pickup> result = switch (caller.role()) {
            case VOLUNTEER, NGO -> pickups.findByCollectorIdOrderByClaimedAtDesc(caller.id());
            case DONOR -> pickups.findByDonationDonorIdOrderByClaimedAtDesc(caller.id());
            case ADMIN -> activeOnly
                    ? pickups.findByStatusInOrderByClaimedAtDesc(DonationService.ACTIVE_PICKUP)
                    : pickups.findAll();
        };
        return result.stream()
                .filter(p -> !activeOnly || p.getStatus().isActive())
                .map(Mapper::pickup)
                .toList();
    }

    private ApiException claimRejection(UUID donationId, Instant now) {
        Donation d = donations.findById(donationId).orElseThrow(() -> ApiException.notFound("Donation"));
        if (!d.getExpiryTime().isAfter(now) || d.getStatus() == DonationStatus.EXPIRED) {
            return ApiException.conflict("This donation has expired.");
        }
        if (d.getStatus() == DonationStatus.CANCELLED) {
            return ApiException.conflict("The donor cancelled this donation.");
        }
        if (d.getStatus() == DonationStatus.AVAILABLE && !d.getPickupDeadline().isAfter(now)) {
            return ApiException.conflict("The pickup deadline for this donation has passed.");
        }
        return ApiException.conflict("Someone else already claimed this donation.");
    }

    /** A cancelled pickup hands the food back to the feed, unless it can no longer be collected in time. */
    private static DonationStatus reopenedStatus(Donation d, Instant now) {
        if (!d.getExpiryTime().isAfter(now)) return DonationStatus.EXPIRED;
        return d.getPickupDeadline().isAfter(now) ? DonationStatus.AVAILABLE : DonationStatus.EXPIRED;
    }

    private void notifyStatusChange(CurrentUser caller, Pickup pickup, PickupStatus next) {
        Donation d = pickup.getDonation();
        User collector = pickup.getCollector();
        switch (next) {
            case DELIVERED -> notifications.notify(d.getDonor(), NotificationType.DONATION_DELIVERED,
                    "Delivered",
                    "\"" + d.getFoodName() + "\" was delivered. " + d.getServings() + " servings rescued.");
            case CANCELLED -> {
                notifications.notify(d.getDonor(), NotificationType.PICKUP_CANCELLED,
                        "Pickup cancelled",
                        "The pickup for \"" + d.getFoodName() + "\" was cancelled"
                                + (d.getStatus() == DonationStatus.AVAILABLE ? " and it is back in the feed." : "."));
                if (!collector.getId().equals(caller.id())) {
                    notifications.notify(collector, NotificationType.PICKUP_CANCELLED,
                            "Pickup cancelled by an admin",
                            "Your pickup of \"" + d.getFoodName() + "\" was cancelled by an admin.");
                }
            }
            default -> notifications.notify(d.getDonor(), NotificationType.PICKUP_STATUS,
                    "Pickup update",
                    collector.getName() + " marked \"" + d.getFoodName() + "\" as " + label(next) + ".");
        }
    }

    private PickupResponse publish(Pickup pickup) {
        PickupResponse response = Mapper.pickup(pickup);
        events.publishEvent(new TrackingEvent(pickup.getId(), "status", response));
        return response;
    }

    private Pickup find(UUID pickupId) {
        return pickups.findWithDetailsById(pickupId).orElseThrow(() -> ApiException.notFound("Pickup"));
    }

    private static void requireCollector(CurrentUser caller, Pickup pickup) {
        if (!pickup.getCollector().getId().equals(caller.id())) {
            throw ApiException.forbidden("Only the assigned collector can do this.");
        }
    }

    private static void requireParticipant(CurrentUser caller, Pickup pickup) {
        boolean participant = caller.isAdmin()
                || pickup.getCollector().getId().equals(caller.id())
                || pickup.getDonation().getDonor().getId().equals(caller.id());
        if (!participant) {
            throw ApiException.forbidden("Only the donor, the collector and admins can view this pickup.");
        }
    }

    private static String label(PickupStatus s) {
        return s.name().toLowerCase(Locale.ROOT).replace('_', ' ');
    }
}
