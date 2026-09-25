package com.foodrescue.dto;

import com.foodrescue.entity.Dietary;
import com.foodrescue.entity.FoodCategory;
import jakarta.validation.constraints.*;

import java.time.Instant;

public record CreateDonationRequest(
        @NotBlank @Size(max = 120) String foodName,
        @NotNull FoodCategory category,
        @NotNull Dietary dietary,
        @Size(max = 120) String quantityDescription,
        @NotNull @Positive @Max(10000) Integer servings,
        @Size(max = 1000) String description,
        @Size(max = 500) @Pattern(regexp = "^https://.*", message = "must be an https URL") String imageUrl,
        @NotBlank @Size(max = 255) String pickupAddress,
        @NotNull @DecimalMin("-90.0") @DecimalMax("90.0") Double pickupLat,
        @NotNull @DecimalMin("-180.0") @DecimalMax("180.0") Double pickupLng,
        @NotNull @Future Instant pickupDeadline,
        @NotNull @Future Instant expiryTime
) {
}
