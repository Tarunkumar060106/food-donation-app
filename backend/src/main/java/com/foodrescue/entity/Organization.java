package com.foodrescue.entity;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "organizations")
public class Organization {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 40)
    private String type;

    private String address;

    @Column(length = 40)
    private String contact;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected Organization() {
    }

    public Organization(String name, String type, String address, String contact) {
        this.name = name;
        this.type = type;
        this.address = address;
        this.contact = contact;
    }

    public UUID getId() { return id; }
    public String getName() { return name; }
    public String getType() { return type; }
    public String getAddress() { return address; }
    public String getContact() { return contact; }
    public Instant getCreatedAt() { return createdAt; }
}
