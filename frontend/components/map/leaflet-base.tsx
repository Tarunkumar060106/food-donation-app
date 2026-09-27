"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useSyncExternalStore } from "react";
import { TileLayer } from "react-leaflet";

export type { LatLng } from "@/lib/geo";

const OSM = {
  url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
};

// Optional custom basemap (for example CARTO). Tile URLs are fetched by the browser, so any key in them is public.
const CUSTOM_LIGHT = process.env.NEXT_PUBLIC_MAP_TILE_URL;
const CUSTOM_DARK = process.env.NEXT_PUBLIC_MAP_TILE_URL_DARK;
const CUSTOM_ATTRIBUTION = process.env.NEXT_PUBLIC_MAP_ATTRIBUTION ?? OSM.attribution;

const DARK_QUERY = "(prefers-color-scheme: dark)";

function subscribeToScheme(onChange: () => void) {
  const mq = window.matchMedia(DARK_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function usePrefersDark() {
  return useSyncExternalStore(subscribeToScheme, () => window.matchMedia(DARK_QUERY).matches, () => false);
}

export function ThemedTiles() {
  const dark = usePrefersDark();
  if (CUSTOM_LIGHT) {
    const url = dark && CUSTOM_DARK ? CUSTOM_DARK : CUSTOM_LIGHT;
    return <TileLayer key={url} url={url} attribution={CUSTOM_ATTRIBUTION} maxZoom={19} />;
  }
  // Standard OSM tiles need no key; `fr-tiles` softens them in light mode and inverts them in dark mode.
  return <TileLayer url={OSM.url} attribution={OSM.attribution} className="fr-tiles" maxZoom={19} />;
}

/** CSS-drawn markers (styled in globals.css), which avoids Leaflet's default image icons breaking under bundlers. */
export const pinIcon = (variant: "pickup" | "collector" | "you" = "pickup") =>
  L.divIcon({
    // Moving markers glide between positions (see .fr-moving in globals.css).
    className: variant === "pickup" ? "" : "fr-moving",
    html: `<span class="fr-pin fr-pin--${variant}"></span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
