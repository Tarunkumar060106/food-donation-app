"use client";

import dynamic from "next/dynamic";

function MapSkeleton() {
  return <div className="h-full w-full animate-pulse bg-sage" aria-label="Loading map" />;
}

export const LocationPickerMap = dynamic(() => import("./LocationPickerMap"), { ssr: false, loading: MapSkeleton });
export const PointsMap = dynamic(() => import("./PointsMap"), { ssr: false, loading: MapSkeleton });
export type { MapPoint } from "./PointsMap";
export type { LatLng } from "@/lib/geo";
