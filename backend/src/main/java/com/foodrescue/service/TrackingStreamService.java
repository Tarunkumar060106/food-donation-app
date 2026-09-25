package com.foodrescue.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Pushes live pickup updates to donors and admins over Server-Sent Events.
 * The database stays the source of truth: events fire only after a commit, and clients
 * can always fall back to GET /api/pickups/{id}/tracking.
 */
@Service
public class TrackingStreamService {

    private static final Logger log = LoggerFactory.getLogger(TrackingStreamService.class);
    private static final long TIMEOUT_MS = Duration.ofMinutes(30).toMillis();

    public record TrackingEvent(UUID pickupId, String name, Object data) {
    }

    private final Map<UUID, Set<SseEmitter>> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(UUID pickupId, Object snapshot) {
        SseEmitter emitter = new SseEmitter(TIMEOUT_MS);
        emitters.computeIfAbsent(pickupId, id -> ConcurrentHashMap.newKeySet()).add(emitter);
        Runnable remove = () -> remove(pickupId, emitter);
        emitter.onCompletion(remove);
        emitter.onTimeout(remove);
        emitter.onError(e -> remove.run());
        send(pickupId, emitter, "snapshot", snapshot);
        return emitter;
    }

    @TransactionalEventListener
    public void onTrackingEvent(TrackingEvent event) {
        Set<SseEmitter> targets = emitters.get(event.pickupId());
        if (targets == null) return;
        for (SseEmitter emitter : targets) {
            send(event.pickupId(), emitter, event.name(), event.data());
        }
    }

    /** Keeps idle connections open through proxies that drop silent streams. */
    @Scheduled(fixedRate = 25_000)
    void heartbeat() {
        emitters.forEach((pickupId, targets) -> targets.forEach(emitter -> {
            try {
                emitter.send(SseEmitter.event().comment("keep-alive"));
            } catch (IOException | IllegalStateException e) {
                remove(pickupId, emitter);
            }
        }));
    }

    private void send(UUID pickupId, SseEmitter emitter, String name, Object data) {
        try {
            emitter.send(SseEmitter.event().name(name).data(data));
        } catch (IOException | IllegalStateException e) {
            log.debug("Dropping closed tracking stream for pickup {}", pickupId);
            remove(pickupId, emitter);
        }
    }

    private void remove(UUID pickupId, SseEmitter emitter) {
        emitters.computeIfPresent(pickupId, (id, set) -> {
            set.remove(emitter);
            return set.isEmpty() ? null : set;
        });
    }
}
