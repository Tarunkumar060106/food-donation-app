package com.foodrescue.dto;

import com.foodrescue.entity.Organization;

import java.util.UUID;

public record OrganizationSummary(UUID id, String name, String type, String address) {

    public static OrganizationSummary from(Organization o) {
        return o == null ? null : new OrganizationSummary(o.getId(), o.getName(), o.getType(), o.getAddress());
    }
}
