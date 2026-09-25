package com.foodrescue.controller;

import com.foodrescue.dto.*;
import com.foodrescue.entity.Dietary;
import com.foodrescue.entity.DonationStatus;
import com.foodrescue.entity.FoodCategory;
import com.foodrescue.security.CurrentUser;
import com.foodrescue.service.DonationService;
import com.foodrescue.service.PickupService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/donations")
@Tag(name = "Donations")
public class DonationController {

    private final DonationService donations;
    private final PickupService pickups;

    public DonationController(DonationService donations, PickupService pickups) {
        this.donations = donations;
        this.pickups = pickups;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('DONOR')")
    @Operation(summary = "Post surplus food")
    public DonationResponse create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody CreateDonationRequest req) {
        return donations.create(CurrentUser.from(jwt), req);
    }

    @GetMapping
    @Operation(summary = "Search donations", description = "Defaults to claimable donations sorted by expiry. "
            + "Collectors also get a match score for each result. Distance uses lat/lng if given, else the caller's saved location.")
    public List<DonationResponse> list(@AuthenticationPrincipal Jwt jwt,
                                       @RequestParam(required = false) DonationStatus status,
                                       @RequestParam(required = false) FoodCategory category,
                                       @RequestParam(required = false) Dietary dietary,
                                       @RequestParam(required = false) Urgency urgency,
                                       @RequestParam(required = false) @Positive Double maxDistanceKm,
                                       @RequestParam(required = false) @DecimalMin("-90.0") @DecimalMax("90.0") Double lat,
                                       @RequestParam(required = false) @DecimalMin("-180.0") @DecimalMax("180.0") Double lng,
                                       @RequestParam(defaultValue = "false") boolean mine,
                                       @RequestParam(defaultValue = "EXPIRY") DonationService.Sort sort) {
        var filters = new DonationService.Filters(status, category, dietary, urgency, maxDistanceKm, lat, lng, mine, sort);
        return donations.list(CurrentUser.from(jwt), filters);
    }

    @GetMapping("/{id}")
    public DonationResponse get(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return donations.get(CurrentUser.from(jwt), id);
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('DONOR', 'ADMIN')")
    public DonationResponse cancel(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return donations.cancel(CurrentUser.from(jwt), id);
    }

    @GetMapping("/{id}/matches")
    @PreAuthorize("hasAnyRole('DONOR', 'ADMIN')")
    @Operation(summary = "Ranked collectors for a donation, with the score breakdown and reason")
    public List<CollectorMatch> matches(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return donations.matches(CurrentUser.from(jwt), id);
    }

    @PostMapping("/{id}/claim")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('VOLUNTEER', 'NGO')")
    @Operation(summary = "Claim a donation", description = "Atomic: if two collectors claim at once, one gets 201 and the other 409.")
    public PickupResponse claim(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return pickups.claim(CurrentUser.from(jwt), id);
    }
}
