"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapContainer, Marker, Polyline, Tooltip, useMap } from "react-leaflet";
import { ThemedTiles, pinIcon } from "./leaflet-base";

export type MapPoint = {
  lat: number;
  lng: number;
  label: string;
  variant?: "pickup" | "collector" | "you";
  /** Navigates here when the marker is clicked. */
  href?: string;
};

function FitToPoints({ points, path, follow }: { points: MapPoint[]; path?: [number, number][]; follow?: boolean }) {
  const map = useMap();
  const key = follow
    ? JSON.stringify([points.map((p) => [p.lat, p.lng]), path?.length ?? 0])
    : String(points.length);
  useEffect(() => {
    const all: [number, number][] = [...points.map((p) => [p.lat, p.lng] as [number, number]), ...(path ?? [])];
    if (all.length === 1) map.setView(all[0], 15);
    else if (all.length > 1) map.fitBounds(all, { padding: [40, 40], maxZoom: 16 });
    // Refit only when the set of points changes (or on every move when following), not on every render.
  }, [map, key]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export default function PointsMap({
  points,
  path,
  follow = false,
}: {
  points: MapPoint[];
  path?: [number, number][];
  /** Refit whenever any point moves, for live tracking. */
  follow?: boolean;
}) {
  const router = useRouter();
  const first = points[0] ?? { lat: 13.0604, lng: 80.2496 };
  return (
    <MapContainer center={[first.lat, first.lng]} zoom={14} scrollWheelZoom={false} className="h-full w-full">
      <ThemedTiles />
      {path && path.length > 1 && <Polyline positions={path} pathOptions={{ className: "fr-route", weight: 4 }} />}
      {points.map((p) => (
        <Marker
          key={`${p.label}-${p.href ?? ""}`}
          position={[p.lat, p.lng]}
          icon={pinIcon(p.variant)}
          eventHandlers={p.href ? { click: () => router.push(p.href!) } : undefined}
        >
          <Tooltip direction="top" offset={[0, -12]}>
            {p.label}
          </Tooltip>
        </Marker>
      ))}
      <FitToPoints points={points} path={path} follow={follow} />
    </MapContainer>
  );
}
