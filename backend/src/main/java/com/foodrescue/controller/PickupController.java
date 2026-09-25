package com.foodrescue.controller;

import com.foodrescue.dto.*;
import com.foodrescue.security.CurrentUser;
import com.foodrescue.service.PickupService;
import com.foodrescue.service.TrackingStreamService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/pickups")
@Tag(name = "Pickups & tracking")
public class PickupController {

    private final PickupService pickups;
    private final TrackingStreamService stream;

    public PickupController(PickupService pickups, TrackingStreamService stream) {
        this.pickups = pickups;
        this.stream = stream;
    }

    @GetMapping
    @Operation(summary = "My pickups", description = "Collectors see their own, donors see pickups of their donations, admins see all.")
    public List<PickupResponse> list(@AuthenticationPrincipal Jwt jwt,
                                     @RequestParam(defaultValue = "false") boolean active) {
        return pickups.list(CurrentUser.from(jwt), active);
    }

    @GetMapping("/{id}")
    public PickupResponse get(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return pickups.get(CurrentUser.from(jwt), id);
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Advance or cancel a pickup", description = "CLAIMED > ARRIVED > PICKED_UP > IN_TRANSIT > DELIVERED. Cancel is allowed before pickup.")
    public PickupResponse updateStatus(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id,
                                       @Valid @RequestBody StatusUpdateRequest req) {
        return pickups.updateStatus(CurrentUser.from(jwt), id, req.status());
    }

    @PatchMapping("/{id}/sharing")
    @PreAuthorize("hasAnyRole('VOLUNTEER', 'NGO')")
    @Operation(summary = "Start or stop sharing live location (explicit consent)")
    public PickupResponse setSharing(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id,
                                     @Valid @RequestBody SharingRequest req) {
        return pickups.setSharing(CurrentUser.from(jwt), id, req.enabled());
    }

    @PostMapping("/{id}/location")
    @PreAuthorize("hasAnyRole('VOLUNTEER', 'NGO')")
    public LocationPoint recordLocation(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id,
                                        @Valid @RequestBody LocationRequest req) {
        return pickups.recordLocation(CurrentUser.from(jwt), id, req);
    }

    @GetMapping("/{id}/tracking")
    @Operation(summary = "Latest status, last known location and recent path")
    public TrackingResponse tracking(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return pickups.tracking(CurrentUser.from(jwt), id);
    }

    @GetMapping(value = "/{id}/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "Live updates (Server-Sent Events)",
            description = "Events: snapshot, status, location. Send the bearer token in the Authorization header "
                    + "(use a fetch-based SSE client; browser EventSource cannot set headers).")
    public SseEmitter stream(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        TrackingResponse snapshot = pickups.tracking(CurrentUser.from(jwt), id);
        return stream.subscribe(id, snapshot);
    }
}
