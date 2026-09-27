import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, MapPinIcon } from "@phosphor-icons/react/ssr";
import { EmptyState, SectionHeader, StatusBadge } from "@/components/app/bits";
import { primaryButton } from "@/components/ui/form";
import { statusLabel } from "@/lib/format";
import { serverApi } from "@/lib/server-api";
import { requireSession } from "@/lib/session";
import { formatDateTime } from "@/lib/time";
import type { Pickup } from "@/lib/types";

export const metadata: Metadata = { title: "My pickups | FoodRescue" };

export default async function MyPickupsPage() {
  await requireSession(["VOLUNTEER", "NGO"]);
  const pickups = await serverApi<Pickup[]>("/pickups");
  const active = pickups.filter((p) => p.status !== "DELIVERED" && p.status !== "CANCELLED");
  const past = pickups.filter((p) => p.status === "DELIVERED" || p.status === "CANCELLED");
  const servings = past.filter((p) => p.status === "DELIVERED").reduce((sum, p) => sum + p.servings, 0);

  return (
    <div className="grid gap-12">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">My pickups</h1>
          <p className="mt-2 text-muted">
            {servings > 0 ? `You've delivered ${servings} servings so far.` : "Pickups show up here once a donor accepts your request."}
          </p>
        </div>
        <Link href="/discover" className={primaryButton}>
          <MapPinIcon size={18} aria-hidden />
          Find food nearby
        </Link>
      </div>

      <section className="grid gap-5">
        <SectionHeader title="In progress" />
        {active.length === 0 ? (
          <EmptyState title="Nothing in progress" body="Request food from the feed. Once the donor accepts, your trip appears here." />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {active.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/pickups/${p.id}`}
                  className="group flex h-full flex-col justify-between gap-5 rounded-2xl bg-forest p-6 text-on-forest transition hover:brightness-110"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-lg font-medium">{p.foodName}</p>
                      <p className="text-sm text-on-forest/75">
                        {p.servings} servings from {p.donor.name}
                      </p>
                      <p className="mt-1 text-sm text-on-forest/60">{p.pickupAddress}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-on-forest/15 px-2.5 py-0.5 text-xs font-medium">{statusLabel[p.status]}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm font-medium">
                    {p.sharingLocation ? "Trip in progress" : "Open trip"}
                    <ArrowRightIcon size={14} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-5">
        <SectionHeader title="History" />
        {past.length === 0 ? (
          <EmptyState title="No finished pickups yet" body="Completed and cancelled pickups are kept here." />
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {past.map((p) => (
              <li key={p.id}>
                <Link href={`/pickups/${p.id}`} className="flex flex-col gap-2 px-5 py-4 transition hover:bg-sage/50 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{p.foodName}</p>
                    <p className="text-sm text-muted">
                      {p.servings} servings from {p.donor.name},{" "}
                      {formatDateTime(p.deliveredAt ?? p.cancelledAt ?? p.claimedAt)} IST
                    </p>
                  </div>
                  <StatusBadge status={p.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
