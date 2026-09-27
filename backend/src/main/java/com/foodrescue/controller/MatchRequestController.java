package com.foodrescue.controller;

import com.foodrescue.dto.MatchRequestResponse;
import com.foodrescue.security.CurrentUser;
import com.foodrescue.service.MatchRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/match-requests")
@Tag(name = "Requests & offers")
public class MatchRequestController {

    private final MatchRequestService requests;

    public MatchRequestController(MatchRequestService requests) {
        this.requests = requests;
    }

    @GetMapping
    @Operation(summary = "My requests and offers",
            description = "Collectors see what they sent and received, donors everything on their donations, admins the latest 200. "
                    + "Pass donationId to narrow to one donation.")
    public List<MatchRequestResponse> list(@AuthenticationPrincipal Jwt jwt, @RequestParam(required = false) UUID donationId) {
        return requests.list(CurrentUser.from(jwt), donationId);
    }

    @PostMapping("/{id}/accept")
    @Operation(summary = "Accept and start the pickup", description = "Only the recipient can accept. Atomic: 409 if the food was already matched.")
    public MatchRequestResponse accept(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return requests.accept(CurrentUser.from(jwt), id);
    }

    @PostMapping("/{id}/decline")
    public MatchRequestResponse decline(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return requests.decline(CurrentUser.from(jwt), id);
    }

    @PostMapping("/{id}/withdraw")
    public MatchRequestResponse withdraw(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return requests.withdraw(CurrentUser.from(jwt), id);
    }
}
