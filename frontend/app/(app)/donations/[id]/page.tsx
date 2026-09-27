import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon } from "@phosphor-icons/react/ssr";
import { LiveCountdown } from "@/components/app/LiveCountdown";
import { EmptyState, StatusBadge } from "@/components/app/bits";
import { CancelDonation } from "@/components/donations/CancelDonation";
import { RequestPanel } from "@/components/donations/RequestPanel";
import { FoodSafetyBadges } from "@/components/donations/FoodSafetyBadges";
import { MatchBreakdown } from "@/components/donations/MatchBreakdown";
import { PointsMap } from "@/components/map";
import { OfferButton } from "@/components/requests/OfferButton";
import { RequestCard } from "@/components/requests/RequestCard";
import { primaryButton } from "@/components/ui/form";
import { categoryLabel, roleLabel, statusLabel } from "@/lib/format";
import { ApiError, serverApi } from "@/lib/server-api";
import { APP_TIME_ZONE_LABEL, formatDateTime } from "@/lib/time";
import { requireSession } from "@/lib/session";
import type { CollectorMatch, Donation, MatchRequest, Session } from "@/lib/types";

export const metadata: Metadata = { title: "Donation | FoodRescue" };

async function loadDonation(id: string) {
  try {
    return await serverApi<Donation>(`/donations/${id}`);
  } catch (e) {
    if (e instanceof ApiError && (e.problem.status === 404 || e.problem.status === 400)) notFound();
    throw e;
  }
}

export default async function DonationPage({ params }: PageProps<"/donations/[id]">) {
  const session = await requireSession();
  const { id } = await params;
  const d = await loadDonation(id);
  const isOwner = session.role === "DONOR" && d.donor.id === session.userId;
  const manages = isOwner || session.role === "ADMIN";
  const isCollector = session.role === "VOLUNTEER" || session.role === "NGO";
  const available = manages && d.status === "AVAILABLE";
  const [matches, requests] = available
    ? await Promise.all([
        serverApi<CollectorMatch[]>(`/donations/${id}/matches`),
        serverApi<MatchRequest[]>(`/match-requests?donationId=${id}`),
      ])
    : [[], []];

  const back = isOwner
    ? { href: "/donations", label: "My donations" }
    : isCollector
      ? { href: "/discover", label: "Discover" }
      : { href: "/dashboard", label: "Dashboard" };
  const open = d.status === "AVAILABLE" || d.status === "CLAIMED";
  const critical = open && d.urgency === "CRITICAL";

  return (
    <div className="grid gap-8">
      <Link href={back.href} className="inline-flex w-fit items-center gap-1.5 text-sm text-muted transition hover:text-ink">
        <ArrowLeftIcon size={14} aria-hidden />
        {back.label}
      </Link>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{d.foodName}</h1>
            <StatusBadge status={d.status} />
          </div>
          <p className="mt-2 text-muted">
            {d.servings} servings, {categoryLabel[d.category].toLowerCase()}, {d.dietary === "VEG" ? "vegetarian" : "non-veg"}. Posted by{" "}
            {isOwner ? "you" : d.donor.name}.
          </p>
          <div className="mt-3">
            <FoodSafetyBadges preparedAt={d.preparedAt} requiresRefrigeration={d.requiresRefrigeration} showTime />
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="grid content-start gap-6 lg:col-span-7">
          <div className={`flex flex-wrap items-end justify-between gap-4 rounded-2xl p-6 ${critical ? "border border-accent/40 bg-accent/10" : "border border-line bg-surface"}`}>
            <div>
              <p className="text-sm text-muted">{open ? "Safe to eat for" : "Status"}</p>
              {open ? (
                <LiveCountdown until={d.expiryTime} className={`text-4xl font-medium md:text-5xl ${critical ? "text-accent" : ""}`} />
              ) : (
                <p className="text-3xl font-medium">{statusLabel[d.status]}</p>
              )}
            </div>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
              <dt className="text-muted">Collect by ({APP_TIME_ZONE_LABEL})</dt>
              <dd className="font-mono tabular-nums">{formatDateTime(d.pickupDeadline)}</dd>
              <dt className="text-muted">Expires ({APP_TIME_ZONE_LABEL})</dt>
              <dd className="font-mono tabular-nums">{formatDateTime(d.expiryTime)}</dd>
            </dl>
          </div>

          {d.imageUrl && (
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-line bg-sage">
              <Image src={d.imageUrl} alt={`Photo of ${d.foodName}`} fill sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" />
            </div>
          )}

          <div className="relative z-0 aspect-[16/10] overflow-hidden rounded-2xl border border-line">
            <PointsMap points={[{ lat: d.pickupLat, lng: d.pickupLng, label: "Pickup spot", variant: "pickup" }]} />
          </div>

          <dl className="grid gap-5 rounded-2xl border border-line bg-surface p-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted">Pickup address</dt>
              <dd className="mt-1">{d.pickupAddress}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Quantity</dt>
              <dd className="mt-1">{d.quantityDescription ?? `${d.servings} servings`}</dd>
            </div>
            {d.distanceKm != null && !isOwner && (
              <div>
                <dt className="text-sm text-muted">Distance from you</dt>
                <dd className="mt-1 font-mono tabular-nums">{d.distanceKm} km</dd>
              </div>
            )}
            {d.description && (
              <div className="sm:col-span-2">
                <dt className="text-sm text-muted">Notes</dt>
                <dd className="mt-1 leading-relaxed">{d.description}</dd>
              </div>
            )}
          </dl>
        </div>

        <aside className="grid content-start gap-6 lg:col-span-5">
          {isCollector && <CollectorSide donation={d} session={session} />}
          {manages && <ManagerSide donation={d} matches={matches} requests={requests} canOffer={isOwner} viewer={session.role} />}
        </aside>
      </div>
    </div>
  );
}

function CollectorSide({ donation: d, session }: { donation: Donation; session: Session }) {
  if (d.status === "AVAILABLE") return <RequestPanel donation={d} />;
  if (d.activePickup?.collector.id === session.userId) {
    return (
      <div className="grid gap-4 rounded-2xl bg-forest p-6 text-on-forest sm:p-8">
        <p className="text-lg font-medium">This is your pickup</p>
        <p className="text-sm text-on-forest/75">Current step: {statusLabel[d.activePickup.status].toLowerCase()}.</p>
        <Link href={`/pickups/${d.activePickup.id}`} className={primaryButton}>
          Open trip
          <ArrowRightIcon size={18} aria-hidden />
        </Link>
      </div>
    );
  }
  return (
    <EmptyState
      title={d.status === "EXPIRED" ? "This donation expired" : d.status === "CANCELLED" ? "The donor cancelled this" : "Already matched"}
      body={d.status === "EXPIRED" || d.status === "CANCELLED" ? "It's no longer available." : "Someone else is collecting it. There's more food waiting in the feed."}
      action={
        <Link href="/discover" className={primaryButton}>
          Back to the feed
        </Link>
      }
    />
  );
}

function ManagerSide({
  donation: d,
  matches,
  requests,
  canOffer,
  viewer,
}: {
  donation: Donation;
  matches: CollectorMatch[];
  requests: MatchRequest[];
  canOffer: boolean;
  viewer: Session["role"];
}) {
  const incoming = requests.filter((r) => r.status === "PENDING" && r.direction === "REQUEST");
  if (d.activePickup) {
    return (
      <div className="grid gap-4 rounded-2xl bg-forest p-6 text-on-forest sm:p-8">
        <p className="text-sm text-on-forest/70">Collector</p>
        <p className="text-2xl font-medium">{d.activePickup.collector.name}</p>
        <p className="text-sm text-on-forest/75">
          {d.activePickup.collector.organizationName ?? roleLabel[d.activePickup.collector.role]}, currently{" "}
          {statusLabel[d.activePickup.status].toLowerCase()}.
        </p>
        <Link href={`/pickups/${d.activePickup.id}`} className={primaryButton}>
          Track pickup
          <ArrowRightIcon size={18} aria-hidden />
        </Link>
      </div>
    );
  }
  if (d.status === "DELIVERED") {
    return (
      <div className="flex items-start gap-4 rounded-2xl bg-forest p-6 text-on-forest sm:p-8">
        <CheckCircleIcon size={28} weight="fill" aria-hidden />
        <div>
          <p className="text-lg font-medium">Delivered</p>
          <p className="mt-1 text-sm text-on-forest/75">{d.servings} servings reached people who needed them.</p>
        </div>
      </div>
    );
  }
  if (d.status !== "AVAILABLE") {
    return <EmptyState title={`This donation is ${statusLabel[d.status].toLowerCase()}`} body="It's no longer in the feed." />;
  }
  return (
    <>
      {incoming.length > 0 && (
        <section className="grid gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Requests <span className="ml-1 rounded-full bg-accent px-2 py-0.5 align-middle text-sm text-on-accent">{incoming.length}</span>
            </h2>
            <p className="mt-1 text-sm text-muted">Accept one and the pickup starts. The others are closed for you.</p>
          </div>
          <ul className="grid gap-3">
            {incoming.map((r) => (
              <li key={r.id}>
                <RequestCard request={r} viewer={viewer} showFood={false} />
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="grid gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Best matches nearby</h2>
          <p className="mt-1 text-sm text-muted">
            Ranked by urgency, distance, capacity and food fit. Homes that are closed until the food expires are left out.
            {canOffer && " Offer it and they can accept, or wait for someone to ask."}
          </p>
        </div>
        {matches.length === 0 ? (
          <EmptyState title="No collectors nearby yet" body="Volunteers and NGOs with a saved location and open hours will appear here." />
        ) : (
          <ol className="grid gap-3">
            {matches.slice(0, 5).map((m, i) => (
              <li key={m.collector.id} className="grid gap-3 rounded-2xl border border-line bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      <span className="mr-2 font-mono text-sm text-muted">{i + 1}</span>
                      {m.collector.organizationName ?? m.collector.name}
                    </p>
                    <p className="text-sm text-muted">{m.match.reason.replace(/^\d+% match, /, "")}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="font-mono text-xl font-medium tabular-nums">{m.match.score}%</span>
                    {canOffer && <OfferButton donationId={d.id} match={m} />}
                  </div>
                </div>
                <MatchBreakdown match={m.match} compact />
              </li>
            ))}
          </ol>
        )}
      </section>
      <CancelDonation donationId={d.id} />
    </>
  );
}
