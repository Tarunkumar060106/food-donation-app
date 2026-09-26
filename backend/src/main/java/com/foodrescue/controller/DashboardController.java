package com.foodrescue.controller;

import com.foodrescue.dto.DashboardSummary;
import com.foodrescue.dto.NotificationResponse;
import com.foodrescue.dto.NotificationsResponse;
import com.foodrescue.dto.UserResponse;
import com.foodrescue.exception.ApiException;
import com.foodrescue.security.CurrentUser;
import com.foodrescue.seed.DemoDataSeeder;
import com.foodrescue.service.DashboardService;
import com.foodrescue.service.NotificationService;
import com.foodrescue.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@Tag(name = "Dashboard, notifications & admin")
public class DashboardController {

    private final DashboardService dashboard;
    private final NotificationService notifications;
    private final UserService users;
    private final DemoDataSeeder seeder;

    public DashboardController(DashboardService dashboard, NotificationService notifications, UserService users,
                               DemoDataSeeder seeder) {
        this.dashboard = dashboard;
        this.notifications = notifications;
        this.users = users;
        this.seeder = seeder;
    }

    @GetMapping("/dashboard/summary")
    @Operation(summary = "Impact metrics", description = "Admins get platform totals, donors their own donations, collectors their own pickups.")
    public DashboardSummary summary(@AuthenticationPrincipal Jwt jwt) {
        return dashboard.summary(CurrentUser.from(jwt));
    }

    @GetMapping("/notifications")
    public NotificationsResponse notifications(@AuthenticationPrincipal Jwt jwt) {
        return notifications.list(CurrentUser.from(jwt).id());
    }

    @PatchMapping("/notifications/{id}/read")
    public NotificationResponse markRead(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return notifications.markRead(id, CurrentUser.from(jwt).id());
    }

    @PostMapping("/notifications/read-all")
    public Map<String, Integer> markAllRead(@AuthenticationPrincipal Jwt jwt) {
        return Map.of("updated", notifications.markAllRead(CurrentUser.from(jwt).id()));
    }

    @GetMapping("/admin/users")
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponse> allUsers() {
        return users.listAll();
    }

    @PostMapping("/admin/demo/reset")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Reset demo activity",
            description = "Deletes all donations, pickups, locations and notifications and re-creates the demo activity relative to now. "
                    + "Accounts are kept. Only available while SEED_DEMO_DATA=true.")
    public DemoDataSeeder.ResetResult resetDemo() {
        if (!seeder.isEnabled()) {
            throw ApiException.forbidden("Demo reset is turned off on this server.");
        }
        return seeder.reset();
    }
}
