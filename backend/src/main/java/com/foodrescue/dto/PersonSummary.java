package com.foodrescue.dto;

import com.foodrescue.entity.Role;
import com.foodrescue.entity.User;

import java.util.UUID;

public record PersonSummary(UUID id, String name, Role role, String organizationName) {

    public static PersonSummary from(User u) {
        return new PersonSummary(u.getId(), u.getName(), u.getRole(),
                u.getOrganization() == null ? null : u.getOrganization().getName());
    }
}
