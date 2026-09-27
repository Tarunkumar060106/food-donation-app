package com.foodrescue.controller;

import com.foodrescue.dto.*;
import com.foodrescue.entity.Dietary;
import com.foodrescue.entity.DonationStatus;
import com.foodrescue.entity.FoodCategory;
import com.foodrescue.security.CurrentUser;
import com.foodrescue.service.DonationService;
import com.foodrescue.service.MatchRequestService;
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
    private final MatchRequestService matchRequests;

    public DonationController(DonationService donations, MatchRequestService matchRequests) {
        this.donations = donations;
        this.matchRequests = matchRequests;
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

    @PostMapping("/{id}/requests")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('VOLUNTEER', 'NGO')")
    @Operation(summary = "Ask the donor for this food",
            description = "The pickup starts when the donor accepts. If the donor already offered it to you, this accepts that offer.")
    public MatchRequestResponse request(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id,
                                        @Valid @RequestBody(required = false) SendMatchRequest req) {
        return matchRequests.request(CurrentUser.from(jwt), id, req == null ? null : req.message());
    }

    @PostMapping("/{id}/offers")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('DONOR')")
    @Operation(summary = "Offer this food to a collector",
            description = "The pickup starts when the collector accepts. If they already asked for it, this accepts their request.")
    public MatchRequestResponse offer(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id,
                                      @Valid @RequestBody SendOfferRequest req) {
        return matchRequests.offer(CurrentUser.from(jwt), id, req.collectorId(), req.message());
    }
}
