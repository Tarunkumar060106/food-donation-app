import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "@phosphor-icons/react/ssr";
import { EmptyState, StatusBadge, TimeLeft, isWaiting } from "@/components/app/bits";
import { primaryButton } from "@/components/ui/form";
import { categoryLabel, statusLabel, timeAgo } from "@/lib/format";
import { serverApi } from "@/lib/server-api";
import { requireSession } from "@/lib/session";
import type { Donation, DonationStatus } from "@/lib/types";

export const metadata: Metadata = { title: "My donations | FoodRescue" };

const VIEWS: { key: string; label: string; statuses: DonationStatus[] | null }[] = [
  { key: "all", label: "All", statuses: null },
  { key: "active", label: "Active", statuses: ["AVAILABLE", "CLAIMED", "PICKED_UP", "IN_TRANSIT"] },
  { key: "delivered", label: "Delivered", statuses: ["DELIVERED"] },
  { key: "closed", label: "Expired or cancelled", statuses: ["EXPIRED", "CANCELLED"] },
];

export default async function MyDonationsPage({ searchParams }: PageProps<"/donations">) {
  await requireSession(["DONOR"]);
  const { view: rawView } = await searchParams;
  const view = VIEWS.find((v) => v.key === rawView) ?? VIEWS[0];
  const all = await serverApi<Donation[]>("/donations?mine=true&sort=NEWEST");
  const shown = view.statuses ? all.filter((d) => view.statuses!.includes(d.status)) : all;
  const counts = Object.fromEntries(VIEWS.map((v) => [v.key, v.statuses ? all.filter((d) => v.statuses!.includes(d.status)).length : all.length]));

  return (
    <div className="grid gap-8">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">My donations</h1>
          <p className="mt-2 text-muted">Everything you&apos;ve posted, newest first.</p>
        </div>
        <Link href="/donations/new" className={primaryButton}>
          <PlusIcon size={18} aria-hidden />
          Post food
        </Link>
      </div>

      <nav aria-label="Filter donations" className="flex gap-2 overflow-x-auto pb-1">
        {VIEWS.map((v) => {
          const active = v.key === view.key;
          return (
            <Link
              key={v.key}
              href={v.key === "all" ? "/donations" : `/donations?view=${v.key}`}
              aria-current={active ? "page" : undefined}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-1.5 text-sm transition ${
                active ? "border-forest bg-forest text-on-forest" : "border-line text-muted hover:border-ink/30 hover:text-ink"
              }`}
            >
              {v.label}
              <span className={`font-mono text-xs ${active ? "text-on-forest/70" : "text-muted"}`}>{counts[v.key]}</span>
            </Link>
          );
        })}
      </nav>

      {shown.length === 0 ? (
        <EmptyState
          title={all.length === 0 ? "You haven't posted anything yet" : `No ${view.label.toLowerCase()} donations`}
          body={all.length === 0 ? "Post surplus food and nearby volunteers are matched straight away." : "Try another filter."}
          action={
            all.length === 0 ? (
              <Link href="/donations/new" className={primaryButton}>
                Post food
              </Link>
            ) : undefined
          }
        />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {shown.map((d) => (
            <li key={d.id}>
              <Link href={`/donations/${d.id}`} className="grid gap-3 px-5 py-4 transition hover:bg-sage/50 sm:grid-cols-12 sm:items-center">
                <div className="min-w-0 sm:col-span-6">
                  <p className="truncate font-medium">{d.foodName}</p>
                  <p className="text-sm text-muted">
                    {d.servings} servings, {categoryLabel[d.category].toLowerCase()}, posted {timeAgo(d.createdAt)}
                  </p>
                </div>
                <p className="text-sm text-muted sm:col-span-3">
                  {d.activePickup
                    ? `${d.activePickup.collector.name}, ${statusLabel[d.activePickup.status].toLowerCase()}`
                    : d.status === "AVAILABLE"
                      ? "Waiting for a collector"
                      : ""}
                </p>
                <div className="flex items-center gap-3 sm:col-span-3 sm:justify-end">
                  {isWaiting(d) && <TimeLeft minutes={d.minutesToExpiry} urgency={d.urgency} />}
                  <StatusBadge status={d.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
