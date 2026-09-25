import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, MapPinIcon, PlusIcon } from "@phosphor-icons/react/ssr";
import { EmptyState, SectionHeader, StatTile, StatusBadge, TimeLeft, isWaiting } from "@/components/app/bits";
import { primaryButton } from "@/components/ui/form";
import { categoryLabel, greeting, numberFormat, statusLabel, timeAgo } from "@/lib/format";
import { serverApi } from "@/lib/server-api";
import { requireSession } from "@/lib/session";
import type { DashboardSummary, Donation, Pickup, Session } from "@/lib/types";

export const metadata: Metadata = { title: "Dashboard | FoodRescue" };

export default async function DashboardPage() {
  const session = await requireSession();
  const summary = await serverApi<DashboardSummary>("/dashboard/summary");
  const firstName = session.name.split(" ")[0];

  return (
    <div className="grid gap-12">
      {session.role === "DONOR" && <DonorDashboard firstName={firstName} summary={summary} />}
      {(session.role === "VOLUNTEER" || session.role === "NGO") && (
        <CollectorDashboard firstName={firstName} summary={summary} session={session} />
      )}
      {session.role === "ADMIN" && <AdminDashboard firstName={firstName} summary={summary} />}
    </div>
  );
}

function Greeting({ firstName, line, action }: { firstName: string; line: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {greeting()}, {firstName}
        </h1>
        <p className="mt-2 text-muted">{line}</p>
      </div>
      {action}
    </div>
  );
}

async function DonorDashboard({ firstName, summary }: { firstName: string; summary: DashboardSummary }) {
  const donations = (await serverApi<Donation[]>("/donations?mine=true&sort=NEWEST")).slice(0, 6);
  return (
    <>
      <Greeting
        firstName={firstName}
        line="Here's what your surplus food has done so far."
        action={
          <Link href="/donations/new" className={primaryButton}>
            <PlusIcon size={18} aria-hidden />
            Post food
          </Link>
        }
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile emphasis label="Servings rescued" value={numberFormat.format(summary.servingsRescued)} />
        <StatTile label="Deliveries completed" value={numberFormat.format(summary.completedDeliveries)} />
        <StatTile label="Pickups in progress" value={numberFormat.format(summary.activePickups)} />
        <StatTile label="Donations posted" value={numberFormat.format(summary.totalDonations)} note={`${summary.expiredDonations} expired`} />
      </div>
      <section className="grid gap-5">
        <SectionHeader title="Recent donations" href="/donations" linkLabel="See all" />
        {donations.length === 0 ? (
          <EmptyState
            title="No donations yet"
            body="Post your first surplus food and nearby volunteers will be matched automatically."
            action={
              <Link href="/donations/new" className={primaryButton}>
                Post food
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {donations.map((d) => (
              <li key={d.id}>
                <Link href={`/donations/${d.id}`} className="flex flex-col gap-2 px-5 py-4 transition hover:bg-sage/50 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{d.foodName}</p>
                    <p className="text-sm text-muted">
                      {d.servings} servings, {categoryLabel[d.category].toLowerCase()}
                      {d.activePickup && `, ${d.activePickup.collector.name} (${statusLabel[d.activePickup.status].toLowerCase()})`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {isWaiting(d) && <TimeLeft minutes={d.minutesToExpiry} urgency={d.urgency} />}
                    <StatusBadge status={d.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

async function CollectorDashboard({ firstName, summary, session }: { firstName: string; summary: DashboardSummary; session: Session }) {
  const [active, urgent] = await Promise.all([
    serverApi<Pickup[]>("/pickups?active=true"),
    serverApi<Donation[]>("/donations?sort=EXPIRY"),
  ]);
  return (
    <>
      <Greeting
        firstName={firstName}
        line={session.role === "NGO" ? "Food your organization can receive, and pickups in progress." : "Food waiting nearby, and your pickups in progress."}
        action={
          <Link href="/discover" className={primaryButton}>
            <MapPinIcon size={18} aria-hidden />
            Find food nearby
          </Link>
        }
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile emphasis label="Servings delivered" value={numberFormat.format(summary.servingsRescued)} />
        <StatTile label="Deliveries completed" value={numberFormat.format(summary.completedDeliveries)} />
        <StatTile label="Active pickups" value={numberFormat.format(summary.activePickups)} />
        <StatTile label="Pickups claimed" value={numberFormat.format(summary.totalDonations)} />
      </div>

      <section className="grid gap-5">
        <SectionHeader title="Your active pickups" href="/pickups" linkLabel="All pickups" />
        {active.length === 0 ? (
          <EmptyState title="No active pickups" body="Claim a donation from the feed and it will show up here." />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {active.map((p) => (
              <li key={p.id}>
                <Link href={`/pickups/${p.id}`} className="group flex h-full flex-col justify-between gap-4 rounded-2xl bg-forest p-5 text-on-forest transition hover:brightness-110">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-medium">{p.foodName}</p>
                      <p className="text-sm text-on-forest/75">{p.pickupAddress}</p>
                    </div>
                    <span className="rounded-full bg-on-forest/15 px-2.5 py-0.5 text-xs font-medium">{statusLabel[p.status]}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm font-medium">
                    Open trip
                    <ArrowRightIcon size={14} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-5">
        <SectionHeader title="Most urgent right now" href="/discover" linkLabel="Open the feed" />
        {urgent.length === 0 ? (
          <EmptyState title="Nothing waiting" body="There's no surplus food waiting right now. New donations appear here as soon as they're posted." />
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {urgent.slice(0, 4).map((d) => (
              <li key={d.id}>
                <Link href={`/donations/${d.id}`} className="flex flex-col gap-2 px-5 py-4 transition hover:bg-sage/50 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {d.foodName} <span className="font-normal text-muted">from {d.donor.name}</span>
                    </p>
                    <p className="text-sm text-muted">{d.match?.reason ?? `${d.servings} servings`}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {d.match && <span className="font-mono text-lg font-medium tabular-nums">{d.match.score}%</span>}
                    <TimeLeft minutes={d.minutesToExpiry} urgency={d.urgency} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

async function AdminDashboard({ firstName, summary }: { firstName: string; summary: DashboardSummary }) {
  const active = await serverApi<Pickup[]>("/pickups?active=true");
  const statuses = Object.entries(summary.byStatus).filter(([, count]) => count > 0);
  return (
    <>
      <Greeting
        firstName={firstName}
        line="Everything happening across FoodRescue right now."
        action={
          <Link href="/admin" className={primaryButton}>
            Open operations
          </Link>
        }
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile emphasis label="Servings rescued" value={numberFormat.format(summary.servingsRescued)} />
        <StatTile label="Deliveries completed" value={numberFormat.format(summary.completedDeliveries)} />
        <StatTile label="Pickups in progress" value={numberFormat.format(summary.activePickups)} />
        <StatTile label="Expired donations" value={numberFormat.format(summary.expiredDonations)} note={`of ${summary.totalDonations} posted`} />
      </div>
      <div className="grid gap-8 lg:grid-cols-12">
        <section className="grid content-start gap-5 lg:col-span-8">
          <SectionHeader title="Pickups in progress" href="/admin" linkLabel="Operations" />
          {active.length === 0 ? (
            <EmptyState title="No active pickups" body="When a volunteer claims a donation, it appears here." />
          ) : (
            <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
              {active.map((p) => (
                <li key={p.id}>
                  <Link href={`/pickups/${p.id}`} className="flex flex-col gap-2 px-5 py-4 transition hover:bg-sage/50 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{p.foodName}</p>
                      <p className="text-sm text-muted">
                        {p.collector.name} for {p.donor.name}, claimed {timeAgo(p.claimedAt)}
                      </p>
                    </div>
                    <StatusBadge status={p.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="grid content-start gap-5 lg:col-span-4">
          <h2 className="text-xl font-semibold tracking-tight">Donations by status</h2>
          <dl className="grid grid-cols-2 gap-3">
            {statuses.map(([status, count]) => (
              <div key={status} className="rounded-2xl border border-line bg-surface p-4">
                <dt className="text-sm text-muted">{statusLabel[status as keyof typeof statusLabel] ?? status}</dt>
                <dd className="mt-1 font-mono text-2xl tabular-nums">{count}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </>
  );
}
