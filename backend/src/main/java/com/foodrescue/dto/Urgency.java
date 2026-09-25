package com.foodrescue.dto;

public enum Urgency {
    CRITICAL, HIGH, NORMAL;

    public static Urgency fromMinutesLeft(long minutes) {
        if (minutes <= 60) return CRITICAL;
        if (minutes <= 180) return HIGH;
        return NORMAL;
    }
}
