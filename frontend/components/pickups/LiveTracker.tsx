"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircleIcon, PhoneIcon } from "@phosphor-icons/react";
import { roleLabel, statusLabel } from "@/lib/format";
import { formatTime } from "@/lib/time";
import type { Tracking } from "@/lib/types";
import { secondsAgoLabel, useNow } from "@/components/app/useNow";
import { PointsMap, type MapPoint } from "@/components/map";
import { secondaryButton } from "@/components/ui/form";
import { StatusTimeline } from "./StatusTimeline";
import { usePickupEvents, type StreamState } from "./usePickupEvents";

const CONNECTION_LABEL: Record<StreamState, string> = {
  connecting: "Connecting",
  live: "Live",
  reconnecting: "Reconnecting",
  closed: "Trip finished",
};

/** Donor and admin view of a pickup, updated in real time from the pickup's event stream. */
export function LiveTracker({ initial }: { initial: Tracking }) {
  const router = useRouter();
  const [tracking, setTracking] = useState(initial);
  const now = useNow();
  const p = tracking.pickup;
  const active = p.status !== "DELIVERED" && p.status !== "CANCELLED";

  const connection = usePickupEvents(p.id, active, {
    onSnapshot: setTracking,
    onStatus: (next) => {
      setTracking((t) => ({ ...t, pickup: next }));
      // Server-rendered header text depends on the status.
      router.refresh();
    },
    onLocation: (point) =>
      setTracking((t) => ({ pickup: { ...t.pickup, lastLocation: point }, path: [...t.path, point] })),
  });

  const points: MapPoint[] = [{ lat: p.pickupLat, lng: p.pickupLng, label: "Pickup spot", variant: "pickup" }];
  if (p.lastLocation) points.push({ lat: p.lastLocation.lat, lng: p.lastLocation.lng, label: p.collector.name, variant: "collector" });
  const updated = secondsAgoLabel(p.lastLocation?.recordedAt, now);
  const live = connection === "live" && p.sharingLocation;

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="grid content-start gap-6 lg:col-span-8">
        <div className="relative z-0 aspect-[16/10] overflow-hidden rounded-2xl border border-line">
          <PointsMap points={points} path={tracking.path.map((pt) => [pt.lat, pt.lng])} follow />
          <div className="pointer-events-none absolute top-3 right-3 z-[1000] flex items-center gap-2 rounded-full bg-surface/90 px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur">
            {live ? (
              <span className="relative flex size-2" aria-hidden>
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60 motion-reduce:animate-none" />
                <span className="relative inline-flex size-2 rounded-full bg-accent" />
              </span>
            ) : (
              <span className={`size-2 rounded-full ${connection === "reconnecting" ? "bg-accent/50" : "bg-muted/50"}`} aria-hidden />
            )}
            <span role="status">{live ? "Live" : active && !p.sharingLocation ? "Waiting for trip to start" : CONNECTION_LABEL[connection]}</span>
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-6">
          <StatusTimeline pickup={p} />
        </div>
      </div>

      <aside className="grid content-start gap-6 lg:col-span-4">
        {p.status === "DELIVERED" ? (
          <div className="flex items-start gap-4 rounded-2xl bg-forest p-6 text-on-forest">
            <CheckCircleIcon size={28} weight="fill" aria-hidden />
            <div>
              <p className="text-lg font-medium">Delivered</p>
              <p className="mt-1 text-sm text-on-forest/75">
                {p.servings} servings delivered{p.deliveredAt ? ` at ${formatTime(p.deliveredAt)} IST` : ""}.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-2 rounded-2xl bg-forest p-6 text-on-forest">
            <p className="text-sm text-on-forest/70">Now</p>
            <p className="text-2xl font-medium">{statusLabel[p.status]}</p>
            <p className="text-sm text-on-forest/75">
              {p.status === "CANCELLED"
                ? "The collector released this pickup."
                : p.sharingLocation
                  ? updated
                    ? `Location updated ${updated}.`
                    : "Waiting for the first location update."
                  : p.lastLocation
                    ? `Location sharing is off. Last seen ${updated}.`
                    : "The volunteer shares their location once they start the trip."}
            </p>
          </div>
        )}

        <div className="grid gap-4 rounded-2xl border border-line bg-surface p-6">
          <div>
            <p className="text-sm text-muted">Collector</p>
            <p className="mt-1 font-medium">{p.collector.name}</p>
            <p className="text-sm text-muted">{p.collector.organizationName ?? roleLabel[p.collector.role]}</p>
          </div>
          {p.collector.phone && (
            <a href={`tel:${p.collector.phone.replace(/\s/g, "")}`} className={`${secondaryButton} w-fit px-4 py-2 text-sm`}>
              <PhoneIcon size={16} aria-hidden />
              Call {p.collector.name.split(" ")[0]}
            </a>
          )}
        </div>
      </aside>
    </div>
  );
}
