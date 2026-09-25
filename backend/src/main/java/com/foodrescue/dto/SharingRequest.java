package com.foodrescue.dto;

import jakarta.validation.constraints.NotNull;

public record SharingRequest(@NotNull Boolean enabled) {
}
