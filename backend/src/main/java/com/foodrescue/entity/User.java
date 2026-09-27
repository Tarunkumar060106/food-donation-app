package com.foodrescue.entity;

import jakarta.persistence.*;

import java.time.Instant;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 120)
    private String name;

    /** Null for phone-only donors. */
    @Column(unique = true, length = 160)
    private String email;

    @Column(name = "password_hash", length = 100)
    private String passwordHash;

    /** E.164 number confirmed by an OTP; the sign-in identity for phone-only donors. */
    @Column(name = "verified_phone", unique = true, length = 20)
    private String verifiedPhone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Column(length = 20)
    private String phone;

    private Double latitude;
    private Double longitude;

    @Column(name = "capacity_servings")
    private Integer capacityServings;

    @Column(name = "accepts_non_veg", nullable = false)
    private boolean acceptsNonVeg = true;

    @Column(name = "has_cool_box", nullable = false)
    private boolean hasCoolBox;

    /** IST wall-clock opening hours for homes and centres. Both null means always open. */
    @Column(name = "opens_at")
    private LocalTime opensAt;

    @Column(name = "closes_at")
    private LocalTime closesAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id")
    private Organization organization;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected User() {
    }

    public User(String name, String email, String passwordHash, Role role) {
        this.name = name;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
    }

    /** A one-time donor who signs in with a verified phone number and has no email or password. */
    public static User phoneDonor(String name, String verifiedPhone) {
        User u = new User(name, null, null, Role.DONOR);
        u.verifiedPhone = verifiedPhone;
        u.phone = verifiedPhone;
        return u;
    }

    public UUID getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public Role getRole() { return role; }
    public String getPhone() { return phone; }
    public Double getLatitude() { return latitude; }
    public Double getLongitude() { return longitude; }
    public Integer getCapacityServings() { return capacityServings; }
    public boolean isAcceptsNonVeg() { return acceptsNonVeg; }
    public boolean isHasCoolBox() { return hasCoolBox; }
    public void setHasCoolBox(boolean hasCoolBox) { this.hasCoolBox = hasCoolBox; }
    public String getVerifiedPhone() { return verifiedPhone; }
    public LocalTime getOpensAt() { return opensAt; }
    public LocalTime getClosesAt() { return closesAt; }
    public Organization getOrganization() { return organization; }
    public Instant getCreatedAt() { return createdAt; }

    public boolean hasLocation() {
        return latitude != null && longitude != null;
    }

    public void setName(String name) { this.name = name; }
    public void setPhone(String phone) { this.phone = phone; }
    public void setCapacityServings(Integer capacityServings) { this.capacityServings = capacityServings; }
    public void setAcceptsNonVeg(boolean acceptsNonVeg) { this.acceptsNonVeg = acceptsNonVeg; }
    public void setOrganization(Organization organization) { this.organization = organization; }

    public void setOpeningHours(LocalTime opensAt, LocalTime closesAt) {
        this.opensAt = opensAt;
        this.closesAt = closesAt;
    }

    public void setLocation(Double latitude, Double longitude) {
        this.latitude = latitude;
        this.longitude = longitude;
    }
}
