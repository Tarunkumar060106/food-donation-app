package com.foodrescue.service;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;

class OpeningHoursTest {

    private final OpeningHours day = new OpeningHours(LocalTime.of(9, 0), LocalTime.of(21, 0));
    private final OpeningHours night = new OpeningHours(LocalTime.of(18, 0), LocalTime.of(2, 0));

    /** Instant for an IST wall-clock time on 26 Sep 2026. */
    private static Instant ist(int hour, int minute) {
        return Instant.parse("2026-09-26T00:00:00Z").plusSeconds(hour * 3600L + minute * 60L - 19800);
    }

    @Test
    void daytimeHoursIncludeOpeningButNotClosingMinute() {
        assertThat(day.isOpenAt(ist(9, 0))).isTrue();
        assertThat(day.isOpenAt(ist(20, 59))).isTrue();
        assertThat(day.isOpenAt(ist(21, 0))).isFalse();
        assertThat(day.isOpenAt(ist(8, 59))).isFalse();
    }

    @Test
    void overnightHoursWrapPastMidnight() {
        assertThat(night.isOpenAt(ist(23, 30))).isTrue();
        assertThat(night.isOpenAt(ist(1, 59))).isTrue();
        assertThat(night.isOpenAt(ist(2, 0))).isFalse();
        assertThat(night.isOpenAt(ist(12, 0))).isFalse();
    }

    @Test
    void nextOpeningIsLaterTodayOrTomorrow() {
        assertThat(day.nextOpening(ist(7, 0))).isEqualTo(ist(9, 0));
        assertThat(day.nextOpening(ist(10, 0))).isEqualTo(ist(10, 0));
        assertThat(day.nextOpening(ist(22, 0))).isEqualTo(ist(9, 0).plusSeconds(86400));
    }

    @Test
    void openDuringChecksTheWholeWindow() {
        assertThat(day.openDuring(ist(7, 0), ist(8, 30))).isFalse();
        assertThat(day.openDuring(ist(7, 0), ist(9, 0))).isTrue();
        assertThat(night.openDuring(ist(12, 0), ist(17, 0))).isFalse();
        assertThat(night.openDuring(ist(12, 0), ist(19, 0))).isTrue();
    }

    @Test
    void labelsInTwentyFourHourTime() {
        assertThat(night.label()).isEqualTo("18:00–02:00");
        assertThat(OpeningHours.time(ist(18, 5))).isEqualTo("18:05");
    }
}
