package com.foodrescue.dto;

import java.util.Map;

public record DashboardSummary(
        String scope,
        long totalDonations,
        long activePickups,
        long completedDeliveries,
        long expiredDonations,
        long servingsRescued,
        Map<String, Long> byStatus
) {
}
