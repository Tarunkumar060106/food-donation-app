package com.foodrescue.dto;

import jakarta.validation.constraints.Size;

public record SendMatchRequest(@Size(max = 300) String message) {
}
