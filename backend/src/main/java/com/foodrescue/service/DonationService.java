package com.foodrescue.service;

import com.foodrescue.dto.*;
import com.foodrescue.entity.*;
import com.foodrescue.exception.ApiException;
import com.foodrescue.repository.DonationRepository;
import com.foodrescue.repository.PickupRepository;
import com.foodrescue.repository.UserRepository;
import com.foodrescue.security.CurrentUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class DonationService {

    static final Set<PickupStatus> ACTIVE_PICKUP = EnumSet.of(
            PickupStatus.CLAIMED, PickupStatus.ARRIVED, PickupStatus.PICKED_UP, PickupStatus.IN_TRANSIT);
    private static final int MAX_MATCHES = 10;
    /** Tolerates small differences between the donor's device clock and the server. */
    private static final Duration PREPARED_CLOCK_SLACK = Duration.ofMinutes(5);
    private static final Duration MAX_PREPARED_AGE = Duration.ofDays(2);

    public enum Sort { EXPIRY, DISTANCE, MATCH, NEWEST }

    public record Filters(DonationStatus status, FoodCategory category, Dietary dietary, Urgency urgency,
                          Double maxDistanceKm, Double lat, Double lng, boolean mine, Sort sort) {
    }

    private final DonationRepository donations;
    private final PickupRepository pickups;
    private final UserRepository users;
    private final MatchingService matching;

    public DonationService(DonationRepository donations, PickupRepository pickups,
                           UserRepository users, MatchingService matching) {
        this.donations = donations;
        this.pickups = pickups;
        this.users = users;
        this.matching = matching;
    }

    @Transactional
    public DonationResponse create(CurrentUser caller, CreateDonationRequest req) {
        Instant now = Instant.now();
        if (req.pickupDeadline().isAfter(req.expiryTime())) {
            throw ApiException.badRequest("The pickup deadline must be on or before the expiry time.");
        }
        if (req.preparedAt() != null) {
            if (req.preparedAt().isAfter(now.plus(PREPARED_CLOCK_SLACK))) {
                throw ApiException.badRequest("The cooking time can't be in the future.");
            }
            if (!req.preparedAt().isBefore(req.expiryTime())) {
                throw ApiException.badRequest("The food must be cooked before it expires.");
            }
            if (req.preparedAt().isBefore(now.minus(MAX_PREPARED_AGE))) {
                throw ApiException.badRequest("Food cooked more than 2 days ago can't be donated.");
            }
        }
        User donor = users.getReferenceById(caller.id());
        Donation d = new Donation(donor, req.foodName().trim(), req.category(), req.dietary(),
                req.quantityDescription(), req.servings(), req.description(), req.imageUrl(),
                req.pickupAddress().trim(), req.pickupLat(), req.pickupLng(), req.pickupDeadline(), req.expiryTime());
        d.setPreparedAt(req.preparedAt());
        d.setRequiresRefrigeration(Boolean.TRUE.equals(req.requiresRefrigeration()));
        return Mapper.donation(donations.save(d), now, null, null, null);
    }

    @Transactional(readOnly = true)
    public List<DonationResponse> list(CurrentUser caller, Filters f) {
        Instant now = Instant.now();
        User me = users.findById(caller.id()).orElseThrow(() -> ApiException.unauthorized("This account no longer exists."));

        // Donors' own lists and the admin view show every status unless one is asked for;
        // the discovery feed defaults to what can still be claimed.
        boolean showAllByDefault = f.mine() || caller.isAdmin();
        DonationStatus statusFilter = f.status() != null ? f.status() : showAllByDefault ? null : DonationStatus.AVAILABLE;

        List<Donation> source;
        if (f.mine()) {
            source = donations.findByDonorIdOrderByCreatedAtDesc(caller.id());
        } else if (statusFilter == null) {
            source = donations.findAllByOrderByCreatedAtDesc();
        } else {
            // Expired rows may not be swept yet, so expired lookups also scan still-open rows.
            Set<DonationStatus> stored = statusFilter == DonationStatus.EXPIRED
                    ? EnumSet.of(DonationStatus.EXPIRED, DonationStatus.AVAILABLE, DonationStatus.CLAIMED)
                    : EnumSet.of(statusFilter);
            source = donations.findByStatusIn(stored);
        }

        Double originLat = f.lat() != null ? f.lat() : me.getLatitude();
        Double originLng = f.lng() != null ? f.lng() : me.getLongitude();
        boolean scoreForCaller = caller.role().isCollector();
        Map<UUID, Pickup> activePickups = activePickupsFor(source);

        Comparator<DonationResponse> order = switch (f.sort() == null ? Sort.EXPIRY : f.sort()) {
            case EXPIRY -> Comparator.comparing(DonationResponse::expiryTime);
            case NEWEST -> Comparator.comparing(DonationResponse::createdAt).reversed();
            case DISTANCE -> Comparator.comparing(DonationResponse::distanceKm, Comparator.nullsLast(Comparator.naturalOrder()));
            case MATCH -> Comparator.comparing((DonationResponse r) -> r.match() == null ? -1 : r.match().score()).reversed();
        };

        return source.stream()
                .map(d -> {
                    Double km = originLat == null || originLng == null ? null
                            : Geo.round1(Geo.distanceKm(originLat, originLng, d.getPickupLat(), d.getPickupLng()));
                    MatchResult match = scoreForCaller ? matching.score(d, me, now) : null;
                    return Mapper.donation(d, now, km, match, activePickups.get(d.getId()));
                })
                .filter(r -> statusFilter == null || r.status() == statusFilter)
                .filter(r -> f.category() == null || r.category() == f.category())
                .filter(r -> f.dietary() == null || r.dietary() == f.dietary())
                .filter(r -> f.urgency() == null || r.urgency() == f.urgency())
                .filter(r -> f.maxDistanceKm() == null || r.distanceKm() != null && r.distanceKm() <= f.maxDistanceKm())
                .sorted(order)
                .toList();
    }

    @Transactional(readOnly = true)
    public DonationResponse get(CurrentUser caller, UUID id) {
        Instant now = Instant.now();
        Donation d = find(id);
        User me = users.findById(caller.id()).orElseThrow(() -> ApiException.unauthorized("This account no longer exists."));
        Double km = me.hasLocation()
                ? Geo.round1(Geo.distanceKm(me.getLatitude(), me.getLongitude(), d.getPickupLat(), d.getPickupLng()))
                : null;
        MatchResult match = caller.role().isCollector() ? matching.score(d, me, now) : null;
        Pickup active = pickups.findFirstByDonationIdAndStatusIn(id, ACTIVE_PICKUP).orElse(null);
        return Mapper.donation(d, now, km, match, active);
    }

    @Transactional
    public DonationResponse cancel(CurrentUser caller, UUID id) {
        Instant now = Instant.now();
        Donation d = find(id);
        requireOwnerOrAdmin(caller, d);
        if (d.effectiveStatus(now) != DonationStatus.AVAILABLE) {
            throw ApiException.conflict("Only donations that are still available can be cancelled. This one is "
                    + d.effectiveStatus(now).name().toLowerCase(Locale.ROOT).replace('_', ' ') + ".");
        }
        d.setStatus(DonationStatus.CANCELLED);
        return Mapper.donation(d, now, null, null, null);
    }

    @Transactional(readOnly = true)
    public List<CollectorMatch> matches(CurrentUser caller, UUID id) {
        Instant now = Instant.now();
        Donation d = find(id);
        requireOwnerOrAdmin(caller, d);
        return users.findByRoleInAndLatitudeIsNotNullAndLongitudeIsNotNull(EnumSet.of(Role.VOLUNTEER, Role.NGO)).stream()
                .map(c -> new CollectorMatch(PersonSummary.from(c), c.getCapacityServings(), matching.score(d, c, now)))
                .sorted(Comparator.comparingInt((CollectorMatch m) -> m.match().score()).reversed())
                .limit(MAX_MATCHES)
                .toList();
    }

    private Map<UUID, Pickup> activePickupsFor(List<Donation> source) {
        if (source.isEmpty()) return Map.of();
        List<UUID> ids = source.stream().map(Donation::getId).toList();
        return pickups.findByDonationIdInAndStatusIn(ids, ACTIVE_PICKUP).stream()
                .collect(Collectors.toMap(p -> p.getDonation().getId(), Function.identity(), (a, b) -> a));
    }

    private Donation find(UUID id) {
        return donations.findById(id).orElseThrow(() -> ApiException.notFound("Donation"));
    }

    private static void requireOwnerOrAdmin(CurrentUser caller, Donation d) {
        if (!caller.isAdmin() && !d.getDonor().getId().equals(caller.id())) {
            throw ApiException.forbidden("Only the donor or an admin can do this.");
        }
    }
}
