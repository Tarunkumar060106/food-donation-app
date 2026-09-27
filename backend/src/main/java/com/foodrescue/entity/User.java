package com.foodrescue.entity;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, unique = true, length = 160)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

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
    public Organization getOrganization() { return organization; }
    public Instant getCreatedAt() { return createdAt; }

    public boolean hasLocation() {
        return latitude != null && longitude != null;
    }

    public void setPhone(String phone) { this.phone = phone; }
    public void setCapacityServings(Integer capacityServings) { this.capacityServings = capacityServings; }
    public void setAcceptsNonVeg(boolean acceptsNonVeg) { this.acceptsNonVeg = acceptsNonVeg; }
    public void setOrganization(Organization organization) { this.organization = organization; }

    public void setLocation(Double latitude, Double longitude) {
        this.latitude = latitude;
        this.longitude = longitude;
    }
}
