package com.foodrescue.dto;

import com.foodrescue.entity.Role;
import jakarta.validation.constraints.*;

public record RegisterRequest(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Email @Size(max = 160) String email,
        @NotBlank @Size(min = 8, max = 72) String password,
        @NotNull Role role,
        @Pattern(regexp = "^[+0-9 ()-]{7,20}$", message = "must be a valid phone number") String phone,
        @DecimalMin("-90.0") @DecimalMax("90.0") Double latitude,
        @DecimalMin("-180.0") @DecimalMax("180.0") Double longitude,
        @Positive @Max(10000) Integer capacityServings,
        Boolean acceptsNonVeg,
        Boolean hasCoolBox,
        @Size(max = 120) String organizationName,
        @Size(max = 40) String organizationType,
        @Size(max = 255) String address
) {
}
