package com.foodrescue.dto;

import jakarta.validation.constraints.*;

import java.time.LocalTime;

/** Replaces the editable profile fields. Collector-only fields are ignored for donors. */
public record UpdateProfileRequest(
        @NotBlank @Size(max = 120) String name,
        @Pattern(regexp = "^[+0-9 ()-]{7,20}$", message = "must be a valid phone number") String phone,
        @DecimalMin("-90.0") @DecimalMax("90.0") Double latitude,
        @DecimalMin("-180.0") @DecimalMax("180.0") Double longitude,
        @Positive @Max(10000) Integer capacityServings,
        Boolean acceptsNonVeg,
        Boolean hasCoolBox,
        LocalTime opensAt,
        LocalTime closesAt
) {
}
