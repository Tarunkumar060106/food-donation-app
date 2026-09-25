package com.foodrescue.service;

import com.foodrescue.entity.*;
import com.foodrescue.repository.DonationRepository;
import com.foodrescue.repository.PickupRepository;
import com.foodrescue.service.TrackingStreamService.TrackingEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.EnumSet;

/**
 * Persists expiry for donations that were never collected. Reads already treat them as
 * expired via Donation.effectiveStatus, so this job only keeps stored data and counts honest.
 */
@Component
public class ExpiryScheduler {

    private static final Logger log = LoggerFactory.getLogger(ExpiryScheduler.class);

    private final DonationRepository donations;
    private final PickupRepository pickups;
    private final NotificationService notifications;
    private final ApplicationEventPublisher events;

    public ExpiryScheduler(DonationRepository donations, PickupRepository pickups,
                           NotificationService notifications, ApplicationEventPublisher events) {
        this.donations = donations;
        this.pickups = pickups;
        this.notifications = notifications;
        this.events = events;
    }

    @Scheduled(fixedDelay = 60_000, initialDelay = 10_000)
    @Transactional
    public void expireOverdueDonations() {
        Instant now = Instant.now();
        var overdue = donations.findExpiredButOpen(now);
        for (Donation d : overdue) {
            d.setStatus(DonationStatus.EXPIRED);
            pickups.findFirstByDonationIdAndStatusIn(d.getId(), EnumSet.of(PickupStatus.CLAIMED, PickupStatus.ARRIVED))
                    .ifPresent(p -> {
                        p.moveTo(PickupStatus.CANCELLED, now);
                        notifications.notify(p.getCollector(), NotificationType.DONATION_EXPIRED,
                                "Pickup expired",
                                "\"" + d.getFoodName() + "\" expired before it was picked up.");
                        events.publishEvent(new TrackingEvent(p.getId(), "status", Mapper.pickup(p)));
                    });
            notifications.notify(d.getDonor(), NotificationType.DONATION_EXPIRED,
                    "Donation expired",
                    "\"" + d.getFoodName() + "\" expired before anyone collected it.");
        }
        if (!overdue.isEmpty()) {
            log.info("Marked {} donation(s) as expired", overdue.size());
        }
    }
}
