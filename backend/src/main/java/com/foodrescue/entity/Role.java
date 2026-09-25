package com.foodrescue.entity;

public enum Role {
    DONOR, VOLUNTEER, NGO, ADMIN;

    public boolean isCollector() {
        return this == VOLUNTEER || this == NGO;
    }
}
