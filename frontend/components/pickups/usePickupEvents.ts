"use client";

import { useEffect, useRef, useState } from "react";
import type { LocationPoint, Pickup, Tracking } from "@/lib/types";

export type StreamState = "connecting" | "live" | "reconnecting" | "closed";

type Handlers = {
  onSnapshot?: (t: Tracking) => void;
  onStatus?: (p: Pickup) => void;
  onLocation?: (point: LocationPoint) => void;
};

const isFinal = (p: Pickup) => p.status === "DELIVERED" || p.status === "CANCELLED";

/**
 * Live pickup updates over Server-Sent Events. Same-origin, so the httpOnly session cookie rides along
 * and the Next proxy adds the bearer token. EventSource reconnects on its own, and the server sends a
 * fresh snapshot on every (re)connect, so nothing is lost across a dropped connection.
 */
export function usePickupEvents(pickupId: string, enabled: boolean, handlers: Handlers) {
  const [state, setState] = useState<StreamState>(enabled ? "connecting" : "closed");
  const latest = useRef(handlers);

  useEffect(() => {
    latest.current = handlers;
  });

  useEffect(() => {
    if (!enabled) return;
    const es = new EventSource(`/api/backend/pickups/${pickupId}/stream`);
    const close = () => {
      es.close();
      setState("closed");
    };

    es.onopen = () => setState("live");
    es.onerror = () => setState(es.readyState === EventSource.CLOSED ? "closed" : "reconnecting");
    es.addEventListener("snapshot", (e) => {
      const t = JSON.parse((e as MessageEvent).data) as Tracking;
      latest.current.onSnapshot?.(t);
      if (isFinal(t.pickup)) close();
    });
    es.addEventListener("status", (e) => {
      const p = JSON.parse((e as MessageEvent).data) as Pickup;
      latest.current.onStatus?.(p);
      if (isFinal(p)) close();
    });
    es.addEventListener("location", (e) => {
      latest.current.onLocation?.(JSON.parse((e as MessageEvent).data) as LocationPoint);
    });
    return () => es.close();
  }, [pickupId, enabled]);

  return state;
}
