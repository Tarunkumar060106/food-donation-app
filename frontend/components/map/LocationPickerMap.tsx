"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, Marker, useMap, useMapEvents } from "react-leaflet";
import type { Marker as LeafletMarker } from "leaflet";
import { ThemedTiles, pinIcon } from "./leaflet-base";
import type { LatLng } from "@/lib/geo";

function ClickToMove({ onChange }: { onChange: (p: LatLng) => void }) {
  useMapEvents({ click: (e) => onChange({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

function FollowValue({ value }: { value: LatLng }) {
  const map = useMap();
  useEffect(() => {
    if (!map.getBounds().contains([value.lat, value.lng])) {
      map.setView([value.lat, value.lng], Math.max(map.getZoom(), 15));
    }
  }, [map, value.lat, value.lng]);
  return null;
}

export default function LocationPickerMap({ value, onChange }: { value: LatLng; onChange: (p: LatLng) => void }) {
  const handlers = useMemo(
    () => ({
      dragend(e: { target: LeafletMarker }) {
        const p = e.target.getLatLng();
        onChange({ lat: p.lat, lng: p.lng });
      },
    }),
    [onChange],
  );

  return (
    <MapContainer center={[value.lat, value.lng]} zoom={15} scrollWheelZoom={false} className="h-full w-full">
      <ThemedTiles />
      <Marker position={[value.lat, value.lng]} draggable icon={pinIcon("pickup")} eventHandlers={handlers} />
      <ClickToMove onChange={onChange} />
      <FollowValue value={value} />
    </MapContainer>
  );
}
