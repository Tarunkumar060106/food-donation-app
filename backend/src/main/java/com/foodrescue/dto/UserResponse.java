package com.foodrescue.dto;

import com.foodrescue.entity.Role;
import com.foodrescue.entity.User;

import java.time.Instant;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String name,
        String email,
        Role role,
        String phone,
        Double latitude,
        Double longitude,
        Integer capacityServings,
        boolean acceptsNonVeg,
        boolean hasCoolBox,
        OrganizationSummary organization,
        Instant createdAt
) {
    public static UserResponse from(User u) {
        return new UserResponse(u.getId(), u.getName(), u.getEmail(), u.getRole(), u.getPhone(),
                u.getLatitude(), u.getLongitude(), u.getCapacityServings(), u.isAcceptsNonVeg(), u.isHasCoolBox(),
                OrganizationSummary.from(u.getOrganization()), u.getCreatedAt());
    }
}
