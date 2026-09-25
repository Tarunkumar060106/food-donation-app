import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, TimeLeft } from "@/components/app/bits";
import { DiscoverFilters, type DiscoverParams } from "@/components/discover/DiscoverFilters";
import { MatchBreakdown } from "@/components/donations/MatchBreakdown";
import { PointsMap, type MapPoint } from "@/components/map";
import { categoryLabel } from "@/lib/format";
import { serverApi } from "@/lib/server-api";
import { requireSession } from "@/lib/session";
import type { Donation, User } from "@/lib/types";

export const metadata: Metadata = { title: "Discover | FoodRescue" };

const pick = <T extends string>(value: unknown, allowed: readonly T[]) =>
  typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;

const coord = (value: unknown, limit: number) => {
  const n = typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(n) && Math.abs(n) <= limit ? value as string : undefined;
};

export default async function DiscoverPage({ searchParams }: PageProps<"/discover">) {
  await requireSession(["VOLUNTEER", "NGO"]);
  const sp = await searchParams;
  const params: DiscoverParams = {
    sort: pick(sp.sort, ["EXPIRY", "MATCH", "DISTANCE"] as const) ?? "EXPIRY",
    category: pick(sp.category, ["COOKED_MEAL", "BAKERY", "PRODUCE", "PACKAGED", "DAIRY", "OTHER"] as const),
    dietary: pick(sp.dietary, ["VEG", "NON_VEG"] as const),
    urgency: pick(sp.urgency, ["CRITICAL", "HIGH"] as const),
    within: pick(sp.within, ["2", "5", "10"] as const),
    view: pick(sp.view, ["list", "map"] as const) ?? "list",
    lat: coord(sp.lat, 90),
    lng: coord(sp.lng, 180),
  };

  const me = await serverApi<User>("/auth/me");
  const origin =
    params.lat && params.lng
      ? { lat: Number(params.lat), lng: Number(params.lng) }
      : me.latitude != null && me.longitude != null
        ? { lat: me.latitude, lng: me.longitude }
        : null;

  const query = new URLSearchParams({ sort: origin || params.sort !== "DISTANCE" ? params.sort : "EXPIRY" });
  if (params.category) query.set("category", params.category);
  if (params.dietary) query.set("dietary", params.dietary);
  if (params.urgency) query.set("urgency", params.urgency);
  if (params.within && origin) query.set("maxDistanceKm", params.within);
  if (params.lat && params.lng) {
    query.set("lat", params.lat);
    query.set("lng", params.lng);
  }
  const donations = await serverApi<Donation[]>(`/donations?${query}`);

  const points: MapPoint[] = donations.map((d) => ({
    lat: d.pickupLat,
    lng: d.pickupLng,
    label: `${d.foodName}, ${d.servings} servings`,
    variant: "pickup",
    href: `/donations/${d.id}`,
  }));
  if (origin) points.push({ ...origin, label: "You", variant: "you" });

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Food waiting nearby</h1>
        <p className="mt-2 text-muted">
          {donations.length === 0
            ? "Nothing matches right now."
            : `${donations.length} donation${donations.length === 1 ? "" : "s"} ready to collect${origin ? "" : ". Add your location to see distances"}.`}
        </p>
      </div>

      <DiscoverFilters current={params} hasLocation={Boolean(origin)} />

      {donations.length === 0 ? (
        <EmptyState
          title="No food matches these filters"
          body="Try widening the distance or clearing a filter. New donations appear here the moment they're posted."
        />
      ) : params.view === "map" ? (
        <div className="relative z-0 aspect-[4/3] overflow-hidden rounded-2xl border border-line md:aspect-[16/9]">
          <PointsMap points={points} />
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {donations.map((d) => (
            <li key={d.id}>
              <Link
                href={`/donations/${d.id}`}
                className={`flex h-full flex-col gap-4 rounded-2xl border bg-surface p-5 transition hover:border-ink/30 ${
                  d.urgency === "CRITICAL" ? "border-accent/50" : "border-line"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-medium">{d.foodName}</p>
                    <p className="text-sm text-muted">
                      {d.servings} servings, {categoryLabel[d.category].toLowerCase()}, {d.dietary === "VEG" ? "veg" : "non-veg"}
                    </p>
                    <p className="text-sm text-muted">
                      {d.donor.name}
                      {d.distanceKm != null && `, ${d.distanceKm} km away`}
                    </p>
                  </div>
                  {d.match && (
                    <div className="text-right">
                      <p className="font-mono text-2xl font-medium tabular-nums">{d.match.score}%</p>
                      <p className="text-xs text-muted">match</p>
                    </div>
                  )}
                </div>
                {d.match && <MatchBreakdown match={d.match} compact />}
                <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-3">
                  <TimeLeft minutes={d.minutesToExpiry} urgency={d.urgency} />
                  <span className="text-sm font-medium">View and claim</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
