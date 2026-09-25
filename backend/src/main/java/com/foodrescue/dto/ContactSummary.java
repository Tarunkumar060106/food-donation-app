package com.foodrescue.dto;

import com.foodrescue.entity.Role;
import com.foodrescue.entity.User;

import java.util.UUID;

/** Includes a phone number, so it is only returned to people taking part in the same pickup. */
public record ContactSummary(UUID id, String name, Role role, String phone, String organizationName) {

    public static ContactSummary from(User u) {
        return new ContactSummary(u.getId(), u.getName(), u.getRole(), u.getPhone(),
                u.getOrganization() == null ? null : u.getOrganization().getName());
    }
}
