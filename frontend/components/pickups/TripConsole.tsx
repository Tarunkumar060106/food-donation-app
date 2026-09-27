"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircleIcon, NavigationArrowIcon, PathIcon, PhoneIcon, SnowflakeIcon, StopCircleIcon } from "@phosphor-icons/react";
import { ApiError, api } from "@/lib/api";
import { statusLabel } from "@/lib/format";
import type { LocationPoint, Pickup, PickupStatus, Tracking } from "@/lib/types";
import { LiveCountdown } from "@/components/app/LiveCountdown";
import { PointsMap, type MapPoint } from "@/components/map";
import { FormAlert, primaryButton, secondaryButton } from "@/components/ui/form";
import { isCollected } from "@/lib/trip";
import { StatusTimeline } from "./StatusTimeline";
import { usePickupEvents } from "./usePickupEvents";

const NEXT_ACTION: Partial<Record<PickupStatus, string>> = {
  ARRIVED: "I've arrived at the pickup",
  PICKED_UP: "I've picked up the food",
  IN_TRANSIT: "Start the delivery",
  DELIVERED: "Mark as delivered",
};

// Send when the volunteer has really moved (ignoring GPS jitter), plus a heartbeat so "last seen" stays fresh.
const MIN_SEND_INTERVAL_MS = 8_000;
const MIN_MOVE_METERS = 15;
const HEARTBEAT_MS = 30_000;

const SIM_STEPS = 12;
const SIM_INTERVAL_MS = 2_500;

function metersBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6_371_000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

type GpsState = "off" | "starting" | "live" | "denied" | "unavailable";

export function TripConsole({ initial, demoTools = false }: { initial: Tracking; demoTools?: boolean }) {
  const router = useRouter();
  const [pickup, setPickup] = useState<Pickup>(initial.pickup);
  const [path, setPath] = useState<LocationPoint[]>(initial.path);
  const resumeSharing =
    initial.pickup.sharingLocation && initial.pickup.status !== "DELIVERED" && initial.pickup.status !== "CANCELLED";
  const [gps, setGps] = useState<GpsState>(resumeSharing ? "starting" : "off");
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const simTimer = useRef<number | null>(null);
  const watchId = useRef<number | null>(null);
  const lastSent = useRef<{ lat: number; lng: number; at: number } | null>(null);

  const active = pickup.status !== "DELIVERED" && pickup.status !== "CANCELLED";
  const forward = pickup.nextStatuses.find((s) => s !== "CANCELLED");
  const canCancel = pickup.nextStatuses.includes("CANCELLED");

  const stopWatching = useCallback(() => {
    if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    lastSent.current = null;
  }, []);

  const send = useCallback(
    async (lat: number, lng: number) => {
      const now = Date.now();
      const prev = lastSent.current;
      if (prev) {
        const elapsed = now - prev.at;
        const moved = metersBetween(prev, { lat, lng });
        const due = (elapsed >= MIN_SEND_INTERVAL_MS && moved >= MIN_MOVE_METERS) || elapsed >= HEARTBEAT_MS;
        if (!due) return;
      }
      lastSent.current = { lat, lng, at: now };
      try {
        const point = await api<LocationPoint>(`/pickups/${pickup.id}/location`, { method: "POST", body: { lat, lng } });
        setPath((p) => [...p, point]);
        setPickup((p) => ({ ...p, lastLocation: point }));
        setLastSentAt(now);
      } catch (err) {
        if (err instanceof ApiError && err.problem.status === 409) {
          stopWatching();
          setGps("off");
          setPickup((p) => ({ ...p, sharingLocation: false }));
        }
      }
    },
    [pickup.id, stopWatching],
  );

  /** Subscribes to GPS updates; state only changes from the geolocation callbacks. */
  const watch = useCallback(() => {
    if (!("geolocation" in navigator) || watchId.current != null) return false;
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setGps("live");
        void send(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setGps(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable");
        if (err.code === err.PERMISSION_DENIED) stopWatching();
      },
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 20_000 },
    );
    return true;
  }, [send, stopWatching]);

  const startWatching = useCallback(() => {
    setGps(watch() ? "starting" : "unavailable");
  }, [watch]);

  // Resume the GPS watch after a reload if the trip was already sharing.
  useEffect(() => {
    if (resumeSharing) watch();
    return stopWatching;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stopSimulation = useCallback(() => {
    if (simTimer.current != null) clearInterval(simTimer.current);
    simTimer.current = null;
    setSimulating(false);
  }, []);

  useEffect(() => stopSimulation, [stopSimulation]);

  // Changes made elsewhere (an admin cancelling, another tab) arrive here too.
  usePickupEvents(pickup.id, active, {
    onStatus: (next) => {
      setPickup(next);
      if (!next.sharingLocation) {
        stopWatching();
        stopSimulation();
        setGps("off");
      }
    },
  });

  /**
   * Demo only (NEXT_PUBLIC_DEMO_TOOLS=true): drives the location along a straight route through the real API,
   * so a laptop demo shows the donor's map moving. Before pickup it heads to the pickup spot; after, away from it.
   */
  function simulate() {
    stopWatching();
    const collected = isCollected(pickup);
    const target = collected
      ? { lat: pickup.pickupLat + 0.016, lng: pickup.pickupLng + 0.018 }
      : { lat: pickup.pickupLat, lng: pickup.pickupLng };
    const start =
      pickup.lastLocation ?? (collected ? { lat: pickup.pickupLat, lng: pickup.pickupLng } : { lat: pickup.pickupLat - 0.012, lng: pickup.pickupLng - 0.01 });
    let step = 1;
    setSimulating(true);
    simTimer.current = window.setInterval(async () => {
      const t = step / SIM_STEPS;
      const wobble = Math.sin(t * Math.PI) * 0.0012;
      const lat = start.lat + (target.lat - start.lat) * t + wobble;
      const lng = start.lng + (target.lng - start.lng) * t - wobble;
      step += 1;
      if (step > SIM_STEPS) stopSimulation();
      try {
        const point = await api<LocationPoint>(`/pickups/${pickup.id}/location`, { method: "POST", body: { lat, lng } });
        setPath((p) => [...p, point]);
        setPickup((p) => ({ ...p, lastLocation: point }));
        setLastSentAt(Date.now());
      } catch {
        stopSimulation();
      }
    }, SIM_INTERVAL_MS);
  }

  async function setSharing(enabled: boolean) {
    setBusy(true);
    setError(null);
    try {
      const updated = await api<Pickup>(`/pickups/${pickup.id}/sharing`, { method: "PATCH", body: { enabled } });
      setPickup(updated);
      if (enabled) startWatching();
      else {
        stopWatching();
        stopSimulation();
        setGps("off");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't update location sharing.");
    } finally {
      setBusy(false);
    }
  }

  async function advance(status: PickupStatus) {
    setBusy(true);
    setError(null);
    try {
      const updated = await api<Pickup>(`/pickups/${pickup.id}/status`, { method: "PATCH", body: { status } });
      setPickup(updated);
      setConfirmCancel(false);
      if (!updated.sharingLocation) {
        stopWatching();
        stopSimulation();
        setGps("off");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't update the pickup.");
    } finally {
      setBusy(false);
    }
  }

  const points: MapPoint[] = [{ lat: pickup.pickupLat, lng: pickup.pickupLng, label: "Pickup spot", variant: "pickup" }];
  if (pickup.lastLocation) points.push({ lat: pickup.lastLocation.lat, lng: pickup.lastLocation.lng, label: "You", variant: "you" });

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="grid content-start gap-6 lg:col-span-7">
        <div className="relative z-0 aspect-[4/3] overflow-hidden rounded-2xl border border-line">
          <PointsMap points={points} path={path.map((p) => [p.lat, p.lng])} follow />
        </div>
        <div className="rounded-2xl border border-line bg-surface p-6">
          <StatusTimeline pickup={pickup} />
        </div>
      </div>

      <aside className="grid content-start gap-6 lg:col-span-5">
        {error && <FormAlert>{error}</FormAlert>}

        {pickup.status === "DELIVERED" ? (
          <div className="flex items-start gap-4 rounded-2xl bg-forest p-6 text-on-forest sm:p-8">
            <CheckCircleIcon size={32} weight="fill" aria-hidden />
            <div>
              <p className="text-xl font-medium">Delivered. Thank you.</p>
              <p className="mt-1 text-on-forest/75">{pickup.servings} servings reached people who needed them.</p>
            </div>
          </div>
        ) : pickup.status === "CANCELLED" ? (
          <div className="rounded-2xl border border-line bg-surface p-6">
            <p className="text-lg font-medium">This pickup was cancelled</p>
            <p className="mt-1 text-sm text-muted">If there&apos;s still time, the donation is back in the feed for someone else.</p>
          </div>
        ) : (
          <div className="grid gap-5 rounded-2xl bg-forest p-6 text-on-forest sm:p-8">
            <div>
              <p className="text-sm text-on-forest/70">Now</p>
              <p className="text-2xl font-medium">{statusLabel[pickup.status]}</p>
            </div>

            <div className="grid gap-3 rounded-[14px] bg-on-forest/10 p-4">
              {pickup.sharingLocation ? (
                <>
                  <p className="flex items-center gap-2 text-sm font-medium">
                    {(gps === "live" || gps === "starting") && (
                      <span className="relative flex size-2.5" aria-hidden>
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60 motion-reduce:animate-none" />
                        <span className="relative inline-flex size-2.5 rounded-full bg-accent" />
                      </span>
                    )}
                    {gps === "live"
                      ? "Sharing your live location"
                      : gps === "denied"
                        ? "Location is blocked"
                        : gps === "unavailable"
                          ? "Waiting for GPS"
                          : "Finding your location..."}
                  </p>
                  <p className="text-sm text-on-forest/70">
                    {gps === "denied"
                      ? "Location permission is blocked. Allow it in your browser, or keep updating status by hand."
                      : gps === "unavailable"
                        ? "GPS isn't available right now. The donor sees your last known spot."
                        : lastSentAt
                          ? "Only the donor and admins can see it. It stops automatically on delivery."
                          : "Only the donor and admins can see it."}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                    <button
                      type="button"
                      onClick={() => setSharing(false)}
                      disabled={busy}
                      className="inline-flex w-fit items-center gap-2 text-sm text-on-forest/80 underline decoration-on-forest/30 underline-offset-4 hover:text-on-forest"
                    >
                      <StopCircleIcon size={16} aria-hidden />
                      Stop sharing
                    </button>
                    {demoTools && (
                      <button
                        type="button"
                        onClick={simulating ? stopSimulation : simulate}
                        className="inline-flex w-fit items-center gap-2 rounded-full border border-dashed border-on-forest/40 px-3 py-1 text-xs text-on-forest/80 hover:text-on-forest"
                      >
                        <PathIcon size={14} aria-hidden />
                        {simulating ? "Stop simulation" : "Simulate movement (demo)"}
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-on-forest/80">
                    Start the trip to share your live location with the donor. It stops automatically when you deliver.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSharing(true)}
                    disabled={busy || !active}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-on-forest px-5 py-2.5 font-medium text-forest transition active:scale-[0.98] disabled:opacity-60"
                  >
                    <NavigationArrowIcon size={18} weight="fill" aria-hidden />
                    Start trip and share location
                  </button>
                </>
              )}
            </div>

            {forward && (
              <button type="button" onClick={() => advance(forward)} disabled={busy} className={`${primaryButton} w-full`}>
                {busy ? "Updating..." : NEXT_ACTION[forward]}
              </button>
            )}

            {canCancel &&
              (confirmCancel ? (
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="flex-1 text-on-forest/80">Release this pickup for someone else?</span>
                  <button type="button" onClick={() => setConfirmCancel(false)} className="text-on-forest/70 hover:text-on-forest">
                    Keep it
                  </button>
                  <button
                    type="button"
                    onClick={() => advance("CANCELLED")}
                    disabled={busy}
                    className="rounded-full bg-on-forest px-4 py-1.5 font-medium text-forest active:scale-[0.98]"
                  >
                    Yes, release
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirmCancel(true)} className="text-sm text-on-forest/70 hover:text-on-forest">
                  I can&apos;t make it
                </button>
              ))}
          </div>
        )}

        <div className="grid gap-4 rounded-2xl border border-line bg-surface p-6">
          <div>
            <p className="text-sm text-muted">{isCollected(pickup) ? "Collected from" : "Pick up from"}</p>
            <p className="mt-1 font-medium">{pickup.donor.name}</p>
            <p className="text-sm text-muted">{pickup.pickupAddress}</p>
          </div>
          {pickup.requiresRefrigeration && (
            <p className="flex items-start gap-2 rounded-[10px] bg-forest/10 p-3 text-sm text-ink">
              <SnowflakeIcon size={16} weight="bold" className="mt-0.5 shrink-0 text-forest dark:text-[#8fbf9f]" aria-hidden />
              Keep this food cold. Use a cool box or insulated bag, and go straight to the drop-off.
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            {pickup.donor.phone && (
              <a href={`tel:${pickup.donor.phone.replace(/\s/g, "")}`} className={`${secondaryButton} px-4 py-2 text-sm`}>
                <PhoneIcon size={16} aria-hidden />
                Call donor
              </a>
            )}
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${pickup.pickupLat},${pickup.pickupLng}`}
              target="_blank"
              rel="noreferrer"
              className={`${secondaryButton} px-4 py-2 text-sm`}
            >
              <NavigationArrowIcon size={16} aria-hidden />
              Directions
            </a>
          </div>
          {active && (pickup.status === "CLAIMED" || pickup.status === "ARRIVED") && (
            <p className="border-t border-line pt-4 text-sm text-muted">
              Food is safe for <LiveCountdown until={pickup.expiryTime} className="text-ink" />
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}
