package com.foodrescue.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record SendOfferRequest(@NotNull UUID collectorId, @Size(max = 300) String message) {
}
