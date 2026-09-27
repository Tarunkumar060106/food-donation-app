package com.foodrescue.dto;

import java.util.UUID;

public record DonationCount(UUID donationId, long count) {
}
