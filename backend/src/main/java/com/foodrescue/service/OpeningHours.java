package com.foodrescue.service;

import com.foodrescue.entity.User;

import java.time.*;
import java.time.format.DateTimeFormatter;

/**
 * Daily opening hours in IST. When closes is earlier than opens the place is open overnight,
 * e.g. 18:00 to 02:00.
 */
public record OpeningHours(LocalTime opens, LocalTime closes) {

    public static final ZoneId ZONE = ZoneId.of("Asia/Kolkata");
    private static final DateTimeFormatter HH_MM = DateTimeFormatter.ofPattern("HH:mm");

    /** Null when the user has no hours set, which means always open. */
    public static OpeningHours of(User u) {
        return u.getOpensAt() == null || u.getClosesAt() == null ? null : new OpeningHours(u.getOpensAt(), u.getClosesAt());
    }

    public boolean isOpenAt(Instant at) {
        LocalTime t = at.atZone(ZONE).toLocalTime();
        return opens.isBefore(closes)
                ? !t.isBefore(opens) && t.isBefore(closes)
                : !t.isBefore(opens) || t.isBefore(closes);
    }

    /** The first moment at or after {@code from} when the place is open. */
    public Instant nextOpening(Instant from) {
        if (isOpenAt(from)) return from;
        ZonedDateTime local = from.atZone(ZONE);
        ZonedDateTime today = local.toLocalDate().atTime(opens).atZone(ZONE);
        return (today.isAfter(local) ? today : today.plusDays(1)).toInstant();
    }

    /** Whether the place is open at any point in [from, to]. */
    public boolean openDuring(Instant from, Instant to) {
        return !nextOpening(from).isAfter(to);
    }

    public String label() {
        return HH_MM.format(opens) + "–" + HH_MM.format(closes);
    }

    public static String time(Instant at) {
        return HH_MM.format(at.atZone(ZONE));
    }
}
