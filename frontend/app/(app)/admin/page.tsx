import type { Metadata } from "next";
import Link from "next/link";
import { AutoRefresh } from "@/components/admin/AutoRefresh";
import { DemoTools } from "@/components/admin/DemoTools";
import { ConfirmAction } from "@/components/app/ConfirmAction";
import { EmptyState, SectionHeader, StatTile, StatusBadge, TimeLeft } from "@/components/app/bits";
import { PointsMap, type MapPoint } from "@/components/map";
import { numberFormat, timeAgo } from "@/lib/format";
import { serverApi } from "@/lib/server-api";
import { requireSession } from "@/lib/session";
import type { DashboardSummary, Donation, Pickup } from "@/lib/types";

export const metadata: Metadata = { title: "Operations | FoodRescue" };

/** A pickup counts as stalled if it was claimed over 45 minutes ago and hasn't been collected. */
const STALL_MINUTES = 45;

async function loadOperations() {
  const [summary, active, open] = await Promise.all([
    serverApi<DashboardSummary>("/dashboard/summary"),
    serverApi<Pickup[]>("/pickups?active=true"),
    serverApi<Donation[]>("/donations?status=AVAILABLE&sort=EXPIRY"),
  ]);
  const now = Date.now();
  const stalledIds = new Set(
    active
      .filter((p) => (p.status === "CLAIMED" || p.status === "ARRIVED") && now - new Date(p.claimedAt).getTime() > STALL_MINUTES * 60_000)
      .map((p) => p.id),
  );
  return { summary, active, open, stalledIds, renderedAt: new Date(now).toISOString() };
}

export default async function OperationsPage() {
  await requireSession(["ADMIN"]);
  const { summary, active, open, stalledIds, renderedAt } = await loadOperations();
  const expiringSoon = open.filter((d) => d.urgency === "CRITICAL" || d.urgency === "HIGH");
  const stalled = active.filter((p) => stalledIds.has(p.id));

  const points: MapPoint[] = [
    ...active.map((p) => ({
      lat: p.lastLocation?.lat ?? p.pickupLat,
      lng: p.lastLocation?.lng ?? p.pickupLng,
      label: `${p.collector.name}: ${p.foodName}`,
      variant: p.lastLocation ? ("collector" as const) : ("pickup" as const),
      href: `/pickups/${p.id}`,
    })),
    ...open.map((d) => ({
      lat: d.pickupLat,
      lng: d.pickupLng,
      label: `Waiting: ${d.foodName}`,
      variant: "pickup" as const,
      href: `/donations/${d.id}`,
    })),
  ];

  return (
    <div className="grid gap-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Operations</h1>
          <p className="mt-2 text-muted">Everything moving right now, and anything that needs a hand.</p>
        </div>
        <AutoRefresh renderedAt={renderedAt} />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile emphasis label="Pickups in progress" value={numberFormat.format(active.length)} />
        <StatTile label="Waiting for a collector" value={numberFormat.format(open.length)} />
        <StatTile label="Expiring within 3 h" value={numberFormat.format(expiringSoon.length)} />
        <StatTile label="Servings rescued" value={numberFormat.format(summary.servingsRescued)} note={`${summary.completedDeliveries} deliveries`} />
      </div>

      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-tight">Live map</h2>
          <div className="flex items-center gap-4 text-sm text-muted">
            <span className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-forest ring-2 ring-accent/40" aria-hidden />
              Collector on the move
            </span>
            <span className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-accent" aria-hidden />
              Pickup spot
            </span>
          </div>
        </div>
        <div className="relative z-0 aspect-[4/3] overflow-hidden rounded-2xl border border-line md:aspect-[21/9]">
          <PointsMap points={points} />
        </div>
      </section>

      <div className="grid gap-10 lg:grid-cols-12">
        <section className="grid content-start gap-5 lg:col-span-7">
          <SectionHeader title="Pickups in progress" />
          {stalled.length > 0 && (
            <p className="rounded-[10px] border border-accent/30 bg-accent/10 px-4 py-3 text-sm">
              {stalled.length} pickup{stalled.length > 1 ? "s have" : " has"} been waiting over {STALL_MINUTES} minutes without collection.
            </p>
          )}
          {active.length === 0 ? (
            <EmptyState title="No pickups in progress" body="When a collector claims a donation, it shows up here." />
          ) : (
            <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
              {active.map((p) => {
                const isStalled = stalledIds.has(p.id);
                return (
                  <li key={p.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <Link href={`/pickups/${p.id}`} className="min-w-0 hover:underline">
                      <p className="truncate font-medium">
                        {p.foodName}
                        {isStalled && <span className="ml-2 text-xs font-normal text-accent">Stalled</span>}
                      </p>
                      <p className="text-sm text-muted">
                        {p.collector.name} for {p.donor.name}, claimed {timeAgo(p.claimedAt)}
                        {p.sharingLocation ? ", sharing location" : ""}
                      </p>
                    </Link>
                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <StatusBadge status={p.status} />
                      {p.nextStatuses.includes("CANCELLED") && (
                        <ConfirmAction
                          label="Cancel"
                          question="Cancel this pickup?"
                          confirmLabel="Cancel pickup"
                          method="PATCH"
                          path={`/pickups/${p.id}/status`}
                          body={{ status: "CANCELLED" }}
                        />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="grid content-start gap-5 lg:col-span-5">
          <SectionHeader title="Expiring soon" />
          {expiringSoon.length === 0 ? (
            <EmptyState title="Nothing about to expire" body="Unclaimed food with less than 3 hours left appears here." />
          ) : (
            <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
              {expiringSoon.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 px-5 py-4">
                  <Link href={`/donations/${d.id}`} className="min-w-0 hover:underline">
                    <p className="truncate font-medium">{d.foodName}</p>
                    <p className="text-sm text-muted">
                      {d.servings} servings from {d.donor.name}
                    </p>
                  </Link>
                  <div className="grid justify-items-end gap-1.5">
                    <TimeLeft minutes={d.minutesToExpiry} urgency={d.urgency} />
                    <ConfirmAction
                      label="Take down"
                      question="Remove from feed?"
                      confirmLabel="Remove"
                      method="POST"
                      path={`/donations/${d.id}/cancel`}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {process.env.NEXT_PUBLIC_DEMO_TOOLS === "true" && <DemoTools />}
    </div>
  );
}
