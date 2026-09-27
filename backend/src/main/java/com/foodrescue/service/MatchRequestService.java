package com.foodrescue.service;

import com.foodrescue.dto.DonationBrief;
import com.foodrescue.dto.MatchRequestResponse;
import com.foodrescue.dto.PersonSummary;
import com.foodrescue.entity.*;
import com.foodrescue.exception.ApiException;
import com.foodrescue.repository.DonationRepository;
import com.foodrescue.repository.MatchRequestRepository;
import com.foodrescue.repository.UserRepository;
import com.foodrescue.security.CurrentUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Mutual acceptance. A pickup only starts when one side proposes and the other accepts:
 * a collector requests food and the donor accepts, or the donor offers food and the collector accepts.
 * Accepting uses the same atomic claim as before, then closes every other pending proposal for that food.
 */
@Service
public class MatchRequestService {

    private final MatchRequestRepository requests;
    private final DonationRepository donations;
    private final UserRepository users;
    private final PickupService pickups;
    private final MatchingService matching;
    private final NotificationService notifications;

    public MatchRequestService(MatchRequestRepository requests, DonationRepository donations, UserRepository users,
                               PickupService pickups, MatchingService matching, NotificationService notifications) {
        this.requests = requests;
        this.donations = donations;
        this.users = users;
        this.pickups = pickups;
        this.matching = matching;
        this.notifications = notifications;
    }

    /** A collector asks the donor for this food. If the donor already offered it to them, that offer is accepted instead. */
    @Transactional
    public MatchRequestResponse request(CurrentUser caller, UUID donationId, String message) {
        Instant now = Instant.now();
        Donation donation = findDonation(donationId);
        requireClaimable(donation, now);
        User collector = me(caller);

        var existing = requests.findByDonationIdAndCollectorIdAndStatus(donationId, collector.getId(), MatchRequestStatus.PENDING);
        if (existing.isPresent()) {
            MatchRequest open = existing.get();
            if (open.getDirection() == MatchDirection.OFFER) {
                return accept(open, now);
            }
            throw ApiException.conflict("You've already asked for this food. The donor will get back to you.");
        }

        MatchRequest saved = requests.save(new MatchRequest(donation, collector, MatchDirection.REQUEST, clean(message), now));
        int score = matching.score(donation, collector, now).score();
        notifications.notify(donation.getDonor(), NotificationType.MATCH_REQUESTED,
                "New pickup request",
                displayName(collector) + " (" + score + "% match) asked to collect \"" + donation.getFoodName() + "\".");
        return toResponse(saved, collector.getId(), now);
    }

    /** The donor offers this food to a collector. If that collector already asked for it, their request is accepted instead. */
    @Transactional
    public MatchRequestResponse offer(CurrentUser caller, UUID donationId, UUID collectorId, String message) {
        Instant now = Instant.now();
        Donation donation = findDonation(donationId);
        if (!donation.getDonor().getId().equals(caller.id())) {
            throw ApiException.forbidden("Only the donor can offer this food.");
        }
        requireClaimable(donation, now);
        User collector = users.findById(collectorId)
                .filter(u -> u.getRole().isCollector())
                .orElseThrow(() -> ApiException.notFound("Collector"));

        var existing = requests.findByDonationIdAndCollectorIdAndStatus(donationId, collectorId, MatchRequestStatus.PENDING);
        if (existing.isPresent()) {
            MatchRequest open = existing.get();
            if (open.getDirection() == MatchDirection.REQUEST) {
                return accept(open, now);
            }
            throw ApiException.conflict("You've already offered this to " + displayName(collector) + ".");
        }

        MatchRequest saved = requests.save(new MatchRequest(donation, collector, MatchDirection.OFFER, clean(message), now));
        notifications.notify(collector, NotificationType.MATCH_OFFERED,
                "Food offered to you",
                displayName(donation.getDonor()) + " offered you \"" + donation.getFoodName() + "\" ("
                        + donation.getServings() + " servings). Accept it to start the pickup.");
        return toResponse(saved, caller.id(), now);
    }

    @Transactional
    public MatchRequestResponse accept(CurrentUser caller, UUID requestId) {
        Instant now = Instant.now();
        MatchRequest r = findPending(requestId, now);
        if (!r.recipient().getId().equals(caller.id())) {
            throw ApiException.forbidden(r.sender().getId().equals(caller.id())
                    ? "You sent this, so the other side has to accept it."
                    : "This isn't addressed to you.");
        }
        return accept(r, now);
    }

    @Transactional
    public MatchRequestResponse decline(CurrentUser caller, UUID requestId) {
        Instant now = Instant.now();
        MatchRequest r = findPending(requestId, now);
        if (!r.recipient().getId().equals(caller.id())) {
            throw ApiException.forbidden("Only the person this was sent to can decline it.");
        }
        r.close(MatchRequestStatus.DECLINED, now);
        Donation d = r.getDonation();
        notifications.notify(r.sender(), NotificationType.MATCH_DECLINED,
                r.getDirection() == MatchDirection.REQUEST ? "Request declined" : "Offer declined",
                displayName(r.recipient()) + " declined " + (r.getDirection() == MatchDirection.REQUEST ? "your request for" : "your offer of")
                        + " \"" + d.getFoodName() + "\".");
        return toResponse(r, caller.id(), now);
    }

    @Transactional
    public MatchRequestResponse withdraw(CurrentUser caller, UUID requestId) {
        Instant now = Instant.now();
        MatchRequest r = findPending(requestId, now);
        if (!r.sender().getId().equals(caller.id())) {
            throw ApiException.forbidden("Only the person who sent this can withdraw it.");
        }
        r.close(MatchRequestStatus.WITHDRAWN, now);
        return toResponse(r, caller.id(), now);
    }

    /** Collectors see what they sent and received, donors everything on their donations, admins the latest 200. */
    @Transactional(readOnly = true)
    public List<MatchRequestResponse> list(CurrentUser caller, UUID donationId) {
        Instant now = Instant.now();
        List<MatchRequest> source;
        if (donationId != null) {
            Donation d = findDonation(donationId);
            boolean owner = d.getDonor().getId().equals(caller.id());
            source = requests.findByDonationIdOrderByCreatedAtDesc(donationId).stream()
                    .filter(r -> owner || caller.isAdmin() || r.getCollector().getId().equals(caller.id()))
                    .toList();
        } else {
            source = switch (caller.role()) {
                case VOLUNTEER, NGO -> requests.findByCollectorIdOrderByCreatedAtDesc(caller.id());
                case DONOR -> requests.findByDonationDonorIdOrderByCreatedAtDesc(caller.id());
                case ADMIN -> requests.findTop200ByOrderByCreatedAtDesc();
            };
        }
        return source.stream().map(r -> toResponse(r, caller.id(), now)).toList();
    }

    private MatchRequestResponse accept(MatchRequest proposal, Instant now) {
        UUID id = proposal.getId();
        Pickup pickup = pickups.startPickup(proposal.getDonation().getId(), proposal.getCollector().getId(), now);
        // The atomic claim clears the persistence context, so reload before changing anything.
        MatchRequest r = requests.findWithDetailsById(id).orElseThrow(() -> ApiException.notFound("Request"));
        Donation d = r.getDonation();
        r.accept(pickup, now);
        User acceptedBy = r.recipient();

        notifications.notify(r.sender(), NotificationType.MATCH_ACCEPTED,
                r.getDirection() == MatchDirection.REQUEST ? "Request accepted" : "Offer accepted",
                r.getDirection() == MatchDirection.REQUEST
                        ? displayName(acceptedBy) + " accepted your request. Head over to collect \"" + d.getFoodName() + "\"."
                        : displayName(acceptedBy) + " accepted \"" + d.getFoodName() + "\" and will collect it.");

        for (MatchRequest other : requests.findByDonationIdAndStatus(d.getId(), MatchRequestStatus.PENDING)) {
            if (other.getId().equals(r.getId())) continue;
            other.close(MatchRequestStatus.CLOSED, now);
            if (!other.getCollector().getId().equals(r.getCollector().getId())) {
                notifications.notify(other.getCollector(), NotificationType.MATCH_CLOSED,
                        "Food went to someone else",
                        "\"" + d.getFoodName() + "\" was matched with another collector. There's more food in the feed.");
            }
        }
        return toResponse(r, acceptedBy.getId(), now);
    }

    private MatchRequest findPending(UUID id, Instant now) {
        MatchRequest r = requests.findWithDetailsById(id).orElseThrow(() -> ApiException.notFound("Request"));
        if (effectiveStatus(r, now) != MatchRequestStatus.PENDING) {
            throw ApiException.conflict(switch (effectiveStatus(r, now)) {
                case ACCEPTED -> "This was already accepted.";
                case DECLINED -> "This was already declined.";
                case WITHDRAWN -> "This was withdrawn.";
                default -> "This food is no longer available.";
            });
        }
        return r;
    }

    private void requireClaimable(Donation d, Instant now) {
        if (d.effectiveStatus(now) != DonationStatus.AVAILABLE) {
            throw ApiException.conflict("This food is no longer available.");
        }
        if (!d.getPickupDeadline().isAfter(now)) {
            throw ApiException.conflict("The pickup deadline for this donation has passed.");
        }
    }

    /** A proposal can't still be open once its food is taken, expired, cancelled or past the pickup deadline. */
    static MatchRequestStatus effectiveStatus(MatchRequest r, Instant now) {
        if (!r.isPending()) return r.getStatus();
        Donation d = r.getDonation();
        boolean open = d.effectiveStatus(now) == DonationStatus.AVAILABLE && d.getPickupDeadline().isAfter(now);
        return open ? MatchRequestStatus.PENDING : MatchRequestStatus.CLOSED;
    }

    private MatchRequestResponse toResponse(MatchRequest r, UUID callerId, Instant now) {
        Donation d = r.getDonation();
        MatchRequestStatus status = effectiveStatus(r, now);
        boolean pending = status == MatchRequestStatus.PENDING;
        return new MatchRequestResponse(
                r.getId(), r.getDirection(), status, r.getMessage(),
                new DonationBrief(d.getId(), d.getFoodName(), d.getServings(), d.effectiveStatus(now), d.getPickupDeadline(),
                        d.getExpiryTime(), d.getPickupAddress(), d.isRequiresRefrigeration(), d.getImageUrl()),
                PersonSummary.from(r.getCollector()), PersonSummary.from(d.getDonor()),
                r.getCollector().getCapacityServings(),
                pending ? matching.score(d, r.getCollector(), now) : null,
                pending && r.recipient().getId().equals(callerId),
                r.sender().getId().equals(callerId),
                r.getPickup() == null ? null : r.getPickup().getId(),
                r.getCreatedAt(), r.getRespondedAt());
    }

    private Donation findDonation(UUID id) {
        return donations.findById(id).orElseThrow(() -> ApiException.notFound("Donation"));
    }

    private User me(CurrentUser caller) {
        return users.findById(caller.id()).orElseThrow(() -> ApiException.unauthorized("This account no longer exists."));
    }

    static String displayName(User u) {
        return u.getOrganization() != null ? u.getOrganization().getName() : u.getName();
    }

    private static String clean(String message) {
        return message == null || message.isBlank() ? null : message.trim();
    }
}
