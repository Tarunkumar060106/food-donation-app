package com.foodrescue.entity;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "pickups")
public class Pickup {

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
    @Column(nullable = false, length = 20)
    private PickupStatus status = PickupStatus.CLAIMED;

    @Column(name = "sharing_location", nullable = false)
    private boolean sharingLocation;

    @Column(name = "last_lat")
    private Double lastLat;

    @Column(name = "last_lng")
    private Double lastLng;

    @Column(name = "last_location_at")
    private Instant lastLocationAt;

    @Column(name = "claimed_at", nullable = false, updatable = false)
    private Instant claimedAt;

    @Column(name = "arrived_at")
    private Instant arrivedAt;

    @Column(name = "picked_up_at")
    private Instant pickedUpAt;

    @Column(name = "in_transit_at")
    private Instant inTransitAt;

    @Column(name = "delivered_at")
    private Instant deliveredAt;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @Version
    private Long version;

    protected Pickup() {
    }

    public Pickup(Donation donation, User collector, Instant claimedAt) {
        this.donation = donation;
        this.collector = collector;
        this.claimedAt = claimedAt;
    }

    /** Moves to the next status and stamps the matching timestamp. Callers must check canTransitionTo first. */
    public void moveTo(PickupStatus next, Instant at) {
        this.status = next;
        switch (next) {
            case ARRIVED -> arrivedAt = at;
            case PICKED_UP -> pickedUpAt = at;
            case IN_TRANSIT -> inTransitAt = at;
            case DELIVERED -> deliveredAt = at;
            case CANCELLED -> cancelledAt = at;
            case CLAIMED -> { }
        }
        if (!next.isActive()) {
            sharingLocation = false;
        }
    }

    public void recordLocation(double lat, double lng, Instant at) {
        this.lastLat = lat;
        this.lastLng = lng;
        this.lastLocationAt = at;
    }

    public UUID getId() { return id; }
    public Donation getDonation() { return donation; }
    public User getCollector() { return collector; }
    public PickupStatus getStatus() { return status; }
    public boolean isSharingLocation() { return sharingLocation; }
    public Double getLastLat() { return lastLat; }
    public Double getLastLng() { return lastLng; }
    public Instant getLastLocationAt() { return lastLocationAt; }
    public Instant getClaimedAt() { return claimedAt; }
    public Instant getArrivedAt() { return arrivedAt; }
    public Instant getPickedUpAt() { return pickedUpAt; }
    public Instant getInTransitAt() { return inTransitAt; }
    public Instant getDeliveredAt() { return deliveredAt; }
    public Instant getCancelledAt() { return cancelledAt; }

    public void setSharingLocation(boolean sharingLocation) { this.sharingLocation = sharingLocation; }
}
