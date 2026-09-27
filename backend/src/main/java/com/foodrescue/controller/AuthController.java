package com.foodrescue.controller;

import com.foodrescue.dto.*;
import com.foodrescue.security.CurrentUser;
import com.foodrescue.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Auth")
public class AuthController {

    private final AuthService auth;

    public AuthController(AuthService auth) {
        this.auth = auth;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest req) {
        return auth.register(req);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return auth.login(req);
    }

    @PostMapping("/phone")
    @Operation(summary = "Sign in with a verified phone number",
            description = "Pass the user_json_url from the Phone.email button. Creates a one-time donor account for new numbers.")
    public AuthResponse phone(@Valid @RequestBody PhoneLoginRequest req) {
        return auth.phoneLogin(req);
    }

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal Jwt jwt) {
        return auth.me(CurrentUser.from(jwt).id());
    }

    @PutMapping("/me")
    @Operation(summary = "Update my profile", description = "Returns a fresh token because the token carries the display name.")
    public AuthResponse updateMe(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody UpdateProfileRequest req) {
        return auth.updateProfile(CurrentUser.from(jwt).id(), req);
    }
}
