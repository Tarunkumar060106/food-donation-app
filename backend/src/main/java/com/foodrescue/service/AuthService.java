package com.foodrescue.service;

import com.foodrescue.dto.AuthResponse;
import com.foodrescue.dto.LoginRequest;
import com.foodrescue.dto.RegisterRequest;
import com.foodrescue.dto.UserResponse;
import com.foodrescue.entity.Organization;
import com.foodrescue.entity.Role;
import com.foodrescue.entity.User;
import com.foodrescue.exception.ApiException;
import com.foodrescue.repository.OrganizationRepository;
import com.foodrescue.repository.UserRepository;
import com.foodrescue.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository users;
    private final OrganizationRepository organizations;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository users, OrganizationRepository organizations,
                       PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.users = users;
        this.organizations = organizations;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (req.role() == Role.ADMIN) {
            throw ApiException.badRequest("Admin accounts can't be created through sign-up.");
        }
        if ((req.latitude() == null) != (req.longitude() == null)) {
            throw ApiException.badRequest("Provide both latitude and longitude, or neither.");
        }
        String email = req.email().trim().toLowerCase(Locale.ROOT);
        if (users.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("An account with this email already exists.");
        }

        User user = new User(req.name().trim(), email, passwordEncoder.encode(req.password()), req.role());
        user.setPhone(req.phone());
        user.setLocation(req.latitude(), req.longitude());
        if (req.role().isCollector()) {
            user.setCapacityServings(req.capacityServings());
            user.setAcceptsNonVeg(req.acceptsNonVeg() == null || req.acceptsNonVeg());
        }
        if (req.role() == Role.NGO) {
            if (req.organizationName() == null || req.organizationName().isBlank()) {
                throw ApiException.badRequest("NGO accounts need an organization name.");
            }
            String type = req.organizationType() == null || req.organizationType().isBlank() ? "NGO" : req.organizationType();
            user.setOrganization(organizations.save(
                    new Organization(req.organizationName().trim(), type, req.address(), req.phone())));
        }
        users.save(user);
        return authResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        User user = users.findByEmailIgnoreCase(req.email().trim())
                .filter(u -> passwordEncoder.matches(req.password(), u.getPasswordHash()))
                .orElseThrow(() -> ApiException.unauthorized("Email or password is incorrect."));
        return authResponse(user);
    }

    @Transactional(readOnly = true)
    public UserResponse me(UUID userId) {
        return UserResponse.from(users.findById(userId)
                .orElseThrow(() -> ApiException.unauthorized("This account no longer exists.")));
    }

    private AuthResponse authResponse(User user) {
        JwtService.IssuedToken token = jwtService.issue(user);
        return new AuthResponse(token.value(), token.expiresAt(), UserResponse.from(user));
    }
}
