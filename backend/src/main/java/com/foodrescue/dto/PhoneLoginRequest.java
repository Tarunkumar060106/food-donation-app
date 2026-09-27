package com.foodrescue.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * @param userJsonUrl the URL the Phone.email button returns after a successful OTP
 * @param name        optional display name for a first-time donor
 */
public record PhoneLoginRequest(@NotBlank @Size(max = 300) String userJsonUrl, @Size(max = 120) String name) {
}
