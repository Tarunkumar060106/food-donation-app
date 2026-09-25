package com.foodrescue.dto;

import com.foodrescue.entity.DonationStatus;

public record StatusCount(DonationStatus status, Long count, Long servings) {
}
