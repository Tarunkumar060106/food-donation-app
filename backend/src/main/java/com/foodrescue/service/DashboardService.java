package com.foodrescue.service;

import com.foodrescue.dto.DashboardSummary;
import com.foodrescue.dto.PickupStatusCount;
import com.foodrescue.dto.StatusCount;
import com.foodrescue.entity.DonationStatus;
import com.foodrescue.entity.PickupStatus;
import com.foodrescue.repository.DonationRepository;
import com.foodrescue.repository.PickupRepository;
import com.foodrescue.security.CurrentUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class DashboardService {

    private static final Set<DonationStatus> IN_PROGRESS =
            EnumSet.of(DonationStatus.CLAIMED, DonationStatus.PICKED_UP, DonationStatus.IN_TRANSIT);

    private final DonationRepository donations;
    private final PickupRepository pickups;

    public DashboardService(DonationRepository donations, PickupRepository pickups) {
        this.donations = donations;
        this.pickups = pickups;
    }

    @Transactional(readOnly = true)
    public DashboardSummary summary(CurrentUser caller) {
        return switch (caller.role()) {
            case ADMIN -> fromDonations("platform", donations.countByStatus());
            case DONOR -> fromDonations("donor", donations.countByStatusForDonor(caller.id()));
            case VOLUNTEER, NGO -> fromPickups(pickups.countByStatusForCollector(caller.id()));
        };
    }

    private static DashboardSummary fromDonations(String scope, List<StatusCount> rows) {
        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (DonationStatus s : DonationStatus.values()) byStatus.put(s.name(), 0L);
        long total = 0, active = 0, delivered = 0, expired = 0, servings = 0;
        for (StatusCount r : rows) {
            byStatus.put(r.status().name(), r.count());
            total += r.count();
            if (IN_PROGRESS.contains(r.status())) active += r.count();
            if (r.status() == DonationStatus.DELIVERED) {
                delivered = r.count();
                servings = r.servings();
            }
            if (r.status() == DonationStatus.EXPIRED) expired = r.count();
        }
        return new DashboardSummary(scope, total, active, delivered, expired, servings, byStatus);
    }

    private static DashboardSummary fromPickups(List<PickupStatusCount> rows) {
        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (PickupStatus s : PickupStatus.values()) byStatus.put(s.name(), 0L);
        long total = 0, active = 0, delivered = 0, servings = 0;
        for (PickupStatusCount r : rows) {
            byStatus.put(r.status().name(), r.count());
            total += r.count();
            if (r.status().isActive()) active += r.count();
            if (r.status() == PickupStatus.DELIVERED) {
                delivered = r.count();
                servings = r.servings();
            }
        }
        return new DashboardSummary("collector", total, active, delivered, 0, servings, byStatus);
    }
}
