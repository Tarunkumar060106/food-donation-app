package com.foodrescue.service;

import com.foodrescue.dto.*;
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

import java.time.LocalTime;
import java.util.Locale;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository users;
    private final OrganizationRepository organizations;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final PhoneVerificationService phoneVerification;

    public AuthService(UserRepository users, OrganizationRepository organizations,
                       PasswordEncoder passwordEncoder, JwtService jwtService,
                       PhoneVerificationService phoneVerification) {
        this.users = users;
        this.organizations = organizations;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.phoneVerification = phoneVerification;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (req.role() == Role.ADMIN) {
            throw ApiException.badRequest("Admin accounts can't be created through sign-up.");
        }
        if (req.role() == Role.DONOR) {
            throw ApiException.badRequest("Donors sign up with their phone number and a one-time code.");
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
            user.setHasCoolBox(Boolean.TRUE.equals(req.hasCoolBox()));
            requireValidHours(req.opensAt(), req.closesAt());
            user.setOpeningHours(req.opensAt(), req.closesAt());
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
                .filter(u -> u.getPasswordHash() != null && passwordEncoder.matches(req.password(), u.getPasswordHash()))
                .orElseThrow(() -> ApiException.unauthorized("Email or password is incorrect."));
        return authResponse(user);
    }

    /**
     * Signs in with a phone number verified by Phone.email. A number seen for the first time becomes a
     * one-time donor account: no email, no password and no organisation.
     */
    @Transactional
    public AuthResponse phoneLogin(PhoneLoginRequest req) {
        PhoneVerificationService.VerifiedPhone phone = phoneVerification.verify(req.userJsonUrl());
        User user = users.findByVerifiedPhone(phone.e164())
                .orElseGet(() -> users.save(User.phoneDonor(nameFor(req, phone), phone.e164())));
        return authResponse(user);
    }

    @Transactional(readOnly = true)
    public UserResponse me(UUID userId) {
        return UserResponse.from(find(userId));
    }

    /** Updates the caller's profile and issues a fresh token, since the token carries the display name. */
    @Transactional
    public AuthResponse updateProfile(UUID userId, UpdateProfileRequest req) {
        User user = find(userId);
        if ((req.latitude() == null) != (req.longitude() == null)) {
            throw ApiException.badRequest("Provide both latitude and longitude, or neither.");
        }
        user.setName(req.name().trim());
        // A verified number is the sign-in identity, so it can't be edited here.
        if (user.getVerifiedPhone() == null) {
            user.setPhone(req.phone() == null || req.phone().isBlank() ? null : req.phone().trim());
        }
        user.setLocation(req.latitude(), req.longitude());
        if (user.getRole().isCollector()) {
            requireValidHours(req.opensAt(), req.closesAt());
            user.setCapacityServings(req.capacityServings());
            user.setAcceptsNonVeg(req.acceptsNonVeg() == null || req.acceptsNonVeg());
            user.setHasCoolBox(Boolean.TRUE.equals(req.hasCoolBox()));
            user.setOpeningHours(req.opensAt(), req.closesAt());
        }
        return authResponse(user);
    }

    private static void requireValidHours(LocalTime opens, LocalTime closes) {
        if ((opens == null) != (closes == null)) {
            throw ApiException.badRequest("Set both an opening and a closing time, or neither.");
        }
        if (opens != null && opens.equals(closes)) {
            throw ApiException.badRequest("Opening and closing times can't be the same. Leave both empty if you're always open.");
        }
    }

    private static String nameFor(PhoneLoginRequest req, PhoneVerificationService.VerifiedPhone phone) {
        if (req.name() != null && !req.name().isBlank()) return req.name().trim();
        String full = ((phone.firstName() == null ? "" : phone.firstName()) + " "
                + (phone.lastName() == null ? "" : phone.lastName())).trim();
        return full.isEmpty() ? "Donor " + phone.e164().substring(phone.e164().length() - 4) : full;
    }

    private User find(UUID userId) {
        return users.findById(userId).orElseThrow(() -> ApiException.unauthorized("This account no longer exists."));
    }

    private AuthResponse authResponse(User user) {
        JwtService.IssuedToken token = jwtService.issue(user);
        return new AuthResponse(token.value(), token.expiresAt(), UserResponse.from(user));
    }
}
