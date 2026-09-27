package com.foodrescue.entity;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

/**
 * A proposed pickup that needs both sides to agree. A REQUEST is sent by the collector and answered
 * by the donor; an OFFER is sent by the donor and answered by the collector.
 */
@Entity
@Table(name = "match_requests")
public class MatchRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "donation_id", nullable = false)
    private Donation donation;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "collector_id", nullable = false)
    private User collector;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private MatchDirection direction;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private MatchRequestStatus status = MatchRequestStatus.PENDING;

    @Column(length = 300)
    private String message;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pickup_id")
    private Pickup pickup;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "responded_at")
    private Instant respondedAt;

    @Version
    private Long version;

    protected MatchRequest() {
    }

    public MatchRequest(Donation donation, User collector, MatchDirection direction, String message, Instant createdAt) {
        this.donation = donation;
        this.collector = collector;
        this.direction = direction;
        this.message = message;
        this.createdAt = createdAt;
    }

    /** The user who has to accept or decline. */
    public User recipient() {
        return direction == MatchDirection.REQUEST ? donation.getDonor() : collector;
    }

    /** The user who started it and may withdraw it. */
    public User sender() {
        return direction == MatchDirection.REQUEST ? collector : donation.getDonor();
    }

    public boolean isPending() {
        return status == MatchRequestStatus.PENDING;
    }

    public void accept(Pickup pickup, Instant at) {
        this.status = MatchRequestStatus.ACCEPTED;
        this.pickup = pickup;
        this.respondedAt = at;
    }

    public void close(MatchRequestStatus outcome, Instant at) {
        this.status = outcome;
        this.respondedAt = at;
    }

    public UUID getId() { return id; }
    public Donation getDonation() { return donation; }
    public User getCollector() { return collector; }
    public MatchDirection getDirection() { return direction; }
    public MatchRequestStatus getStatus() { return status; }
    public String getMessage() { return message; }
    public Pickup getPickup() { return pickup; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getRespondedAt() { return respondedAt; }
}
