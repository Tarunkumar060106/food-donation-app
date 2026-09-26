package com.foodrescue.entity;

import jakarta.persistence.*;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "donations")
public class Donation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "donor_id", nullable = false)
    private User donor;

    @Column(name = "food_name", nullable = false, length = 120)
    private String foodName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FoodCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Dietary dietary;

    @Column(name = "quantity_description", length = 120)
    private String quantityDescription;

    @Column(nullable = false)
    private Integer servings;

    @Column(length = 1000)
    private String description;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "pickup_address", nullable = false)
    private String pickupAddress;

    @Column(name = "pickup_lat", nullable = false)
    private Double pickupLat;

    @Column(name = "pickup_lng", nullable = false)
    private Double pickupLng;

    @Column(name = "pickup_deadline", nullable = false)
    private Instant pickupDeadline;

    @Column(name = "expiry_time", nullable = false)
    private Instant expiryTime;

    @Column(name = "prepared_at")
    private Instant preparedAt;

    @Column(name = "requires_refrigeration", nullable = false)
    private boolean requiresRefrigeration;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DonationStatus status = DonationStatus.AVAILABLE;

    @Version
    private Long version;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    protected Donation() {
    }

    public Donation(User donor, String foodName, FoodCategory category, Dietary dietary,
                    String quantityDescription, int servings, String description, String imageUrl,
                    String pickupAddress, double pickupLat, double pickupLng,
                    Instant pickupDeadline, Instant expiryTime) {
        this.donor = donor;
        this.foodName = foodName;
        this.category = category;
        this.dietary = dietary;
        this.quantityDescription = quantityDescription;
        this.servings = servings;
        this.description = description;
        this.imageUrl = imageUrl;
        this.pickupAddress = pickupAddress;
        this.pickupLat = pickupLat;
        this.pickupLng = pickupLng;
        this.pickupDeadline = pickupDeadline;
        this.expiryTime = expiryTime;
    }

    @PreUpdate
    void touch() {
        updatedAt = Instant.now();
    }

    /** Expiry is judged against the clock, so a lagging scheduler never shows stale food as available. */
    public DonationStatus effectiveStatus(Instant now) {
        boolean notYetCollected = status == DonationStatus.AVAILABLE || status == DonationStatus.CLAIMED;
        return notYetCollected && !expiryTime.isAfter(now) ? DonationStatus.EXPIRED : status;
    }

    public long minutesToExpiry(Instant now) {
        return Math.max(0, Duration.between(now, expiryTime).toMinutes());
    }

    public UUID getId() { return id; }
    public User getDonor() { return donor; }
    public String getFoodName() { return foodName; }
    public FoodCategory getCategory() { return category; }
    public Dietary getDietary() { return dietary; }
    public String getQuantityDescription() { return quantityDescription; }
    public Integer getServings() { return servings; }
    public String getDescription() { return description; }
    public String getImageUrl() { return imageUrl; }
    public String getPickupAddress() { return pickupAddress; }
    public Double getPickupLat() { return pickupLat; }
    public Double getPickupLng() { return pickupLng; }
    public Instant getPickupDeadline() { return pickupDeadline; }
    public Instant getExpiryTime() { return expiryTime; }
    public DonationStatus getStatus() { return status; }
    public Long getVersion() { return version; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    public Instant getPreparedAt() { return preparedAt; }
    public boolean isRequiresRefrigeration() { return requiresRefrigeration; }

    public void setStatus(DonationStatus status) { this.status = status; }
    public void setPreparedAt(Instant preparedAt) { this.preparedAt = preparedAt; }
    public void setRequiresRefrigeration(boolean requiresRefrigeration) { this.requiresRefrigeration = requiresRefrigeration; }
}
