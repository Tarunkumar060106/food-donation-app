package com.foodrescue.entity;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "location_updates")
public class LocationUpdate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pickup_id", nullable = false)
    private Pickup pickup;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(name = "recorded_at", nullable = false)
    private Instant recordedAt;

    protected LocationUpdate() {
    }

    public LocationUpdate(Pickup pickup, double latitude, double longitude, Instant recordedAt) {
        this.pickup = pickup;
        this.latitude = latitude;
        this.longitude = longitude;
        this.recordedAt = recordedAt;
    }

    public Long getId() { return id; }
    public Pickup getPickup() { return pickup; }
    public Double getLatitude() { return latitude; }
    public Double getLongitude() { return longitude; }
    public Instant getRecordedAt() { return recordedAt; }
}
