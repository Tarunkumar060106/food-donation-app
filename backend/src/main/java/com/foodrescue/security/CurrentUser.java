package com.foodrescue.security;

import com.foodrescue.entity.Role;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.UUID;

/** The signed-in caller, read from the verified JWT. */
public record CurrentUser(UUID id, Role role) {

    public static CurrentUser from(Jwt jwt) {
        return new CurrentUser(UUID.fromString(jwt.getSubject()),
                Role.valueOf(jwt.getClaimAsString(JwtService.ROLE_CLAIM)));
    }

    public boolean isAdmin() {
        return role == Role.ADMIN;
    }
}
