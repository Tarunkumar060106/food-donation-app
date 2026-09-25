"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CrosshairIcon, ListBulletsIcon, MapTrifoldIcon, XIcon } from "@phosphor-icons/react";
import { categoryLabel } from "@/lib/format";
import type { FoodCategory } from "@/lib/types";
import { Select } from "@/components/ui/form";

export type DiscoverParams = {
  sort: "EXPIRY" | "MATCH" | "DISTANCE";
  category?: FoodCategory;
  dietary?: "VEG" | "NON_VEG";
  urgency?: "CRITICAL" | "HIGH";
  within?: string;
  view: "list" | "map";
  lat?: string;
  lng?: string;
};

const DEFAULTS: Partial<DiscoverParams> = { sort: "EXPIRY", view: "list" };

const SORTS: { value: DiscoverParams["sort"]; label: string }[] = [
  { value: "EXPIRY", label: "Most urgent" },
  { value: "MATCH", label: "Best match" },
  { value: "DISTANCE", label: "Nearest" },
];

export function DiscoverFilters({ current, hasLocation }: { current: DiscoverParams; hasLocation: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const filtered = Boolean(current.category || current.dietary || current.urgency || current.within);

  function update(patch: Partial<DiscoverParams>) {
    const next = { ...current, ...patch };
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) {
      if (v && DEFAULTS[k as keyof DiscoverParams] !== v) qs.set(k, String(v));
    }
    const url = qs.size ? `${pathname}?${qs}` : pathname;
    startTransition(() => router.replace(url, { scroll: false }));
  }

  function locate() {
    if (!("geolocation" in navigator)) return setLocError("This browser can't share location.");
    setLocating(true);
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        update({ lat: pos.coords.latitude.toFixed(5), lng: pos.coords.longitude.toFixed(5) });
      },
      () => {
        setLocating(false);
        setLocError("Couldn't get your location.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div className={`grid gap-4 transition-opacity ${pending ? "opacity-60" : ""}`} aria-busy={pending}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="radiogroup" aria-label="Sort by" className="flex rounded-full border border-line bg-surface p-1">
          {SORTS.map((s) => {
            const on = current.sort === s.value;
            const disabled = s.value === "DISTANCE" && !hasLocation;
            return (
              <button
                key={s.value}
                type="button"
                role="radio"
                aria-checked={on}
                disabled={disabled}
                title={disabled ? "Add your location to sort by distance" : undefined}
                onClick={() => update({ sort: s.value })}
                className={`rounded-full px-4 py-1.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  on ? "bg-forest text-on-forest" : "text-muted hover:text-ink"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        <div role="group" aria-label="View" className="flex rounded-full border border-line bg-surface p-1">
          {(["list", "map"] as const).map((v) => {
            const Icon = v === "list" ? ListBulletsIcon : MapTrifoldIcon;
            const on = current.view === v;
            return (
              <button
                key={v}
                type="button"
                aria-pressed={on}
                onClick={() => update({ view: v })}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition ${on ? "bg-forest text-on-forest" : "text-muted hover:text-ink"}`}
              >
                <Icon size={16} aria-hidden />
                {v === "list" ? "List" : "Map"}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          id="within"
          variant="pill"
          aria-label="Distance"
          value={current.within ?? ""}
          disabled={!hasLocation}
          onChange={(e) => update({ within: e.target.value || undefined })}
        >
          <option value="">Any distance</option>
          <option value="2">Within 2 km</option>
          <option value="5">Within 5 km</option>
          <option value="10">Within 10 km</option>
        </Select>
        <Select
          id="category"
          variant="pill"
          aria-label="Food type"
          value={current.category ?? ""}
          onChange={(e) => update({ category: (e.target.value || undefined) as FoodCategory | undefined })}
        >
          <option value="">All food</option>
          {(Object.keys(categoryLabel) as FoodCategory[]).map((c) => (
            <option key={c} value={c}>
              {categoryLabel[c]}
            </option>
          ))}
        </Select>
        <Select
          id="dietary"
          variant="pill"
          aria-label="Dietary"
          value={current.dietary ?? ""}
          onChange={(e) => update({ dietary: (e.target.value || undefined) as DiscoverParams["dietary"] })}
        >
          <option value="">Veg and non-veg</option>
          <option value="VEG">Vegetarian only</option>
          <option value="NON_VEG">Non-veg only</option>
        </Select>
        <Select
          id="urgency"
          variant="pill"
          aria-label="Time left"
          value={current.urgency ?? ""}
          onChange={(e) => update({ urgency: (e.target.value || undefined) as DiscoverParams["urgency"] })}
        >
          <option value="">Any time left</option>
          <option value="CRITICAL">Under 1 hour</option>
          <option value="HIGH">1 to 3 hours</option>
        </Select>

        <button
          type="button"
          onClick={locate}
          disabled={locating}
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink transition hover:border-ink/30 disabled:opacity-60"
        >
          <CrosshairIcon size={16} aria-hidden />
          {locating ? "Locating..." : current.lat ? "Using your current location" : "Use my location"}
        </button>

        {filtered && (
          <button
            type="button"
            onClick={() => update({ category: undefined, dietary: undefined, urgency: undefined, within: undefined })}
            className="inline-flex items-center gap-1 px-2 py-2 text-sm text-muted transition hover:text-ink"
          >
            <XIcon size={14} aria-hidden />
            Clear filters
          </button>
        )}
        {locError && <span className="text-sm text-accent">{locError}</span>}
      </div>
    </div>
  );
}
