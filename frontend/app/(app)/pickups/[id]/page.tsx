import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, PhoneIcon } from "@phosphor-icons/react/ssr";
import { StatusBadge } from "@/components/app/bits";
import { PointsMap, type MapPoint } from "@/components/map";
import { StatusTimeline } from "@/components/pickups/StatusTimeline";
import { TripConsole } from "@/components/pickups/TripConsole";
import { secondaryButton } from "@/components/ui/form";
import { roleLabel } from "@/lib/format";
import { ApiError, serverApi } from "@/lib/server-api";
import { requireSession } from "@/lib/session";
import { formatTime } from "@/lib/time";
import { tripSummary } from "@/lib/trip";
import type { Tracking } from "@/lib/types";

export const metadata: Metadata = { title: "Pickup | FoodRescue" };

async function loadTracking(id: string) {
  try {
    return await serverApi<Tracking>(`/pickups/${id}/tracking`);
  } catch (e) {
    // 403 is treated like 404 so people outside a pickup can't probe which pickups exist.
    if (e instanceof ApiError && [400, 403, 404].includes(e.problem.status)) notFound();
    throw e;
  }
}

export default async function PickupPage({ params }: PageProps<"/pickups/[id]">) {
  const session = await requireSession();
  const { id } = await params;
  const tracking = await loadTracking(id);
  const p = tracking.pickup;
  const isCollector = p.collector.id === session.userId;

  return (
    <div className="grid gap-8">
      <Link
        href={isCollector ? "/pickups" : `/donations/${p.donationId}`}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted transition hover:text-ink"
      >
        <ArrowLeftIcon size={14} aria-hidden />
        {isCollector ? "My pickups" : "Donation"}
      </Link>

      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{p.foodName}</h1>
          <StatusBadge status={p.status} />
        </div>
        <p className="mt-2 text-muted">
          {p.servings} servings. {tripSummary(p, isCollector ? "collector" : "observer")}
        </p>
      </div>

      {isCollector ? <TripConsole initial={tracking} /> : <TripOverview tracking={tracking} />}
    </div>
  );
}

function TripOverview({ tracking }: { tracking: Tracking }) {
  const p = tracking.pickup;
  const points: MapPoint[] = [{ lat: p.pickupLat, lng: p.pickupLng, label: "Pickup spot", variant: "pickup" }];
  if (p.lastLocation) points.push({ lat: p.lastLocation.lat, lng: p.lastLocation.lng, label: p.collector.name, variant: "collector" });

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="grid content-start gap-6 lg:col-span-8">
        <div className="relative z-0 aspect-[16/10] overflow-hidden rounded-2xl border border-line">
          <PointsMap points={points} path={tracking.path.map((pt) => [pt.lat, pt.lng])} />
        </div>
        <div className="rounded-2xl border border-line bg-surface p-6">
          <StatusTimeline pickup={p} />
        </div>
      </div>
      <aside className="grid content-start gap-6 lg:col-span-4">
        <div className="grid gap-2 rounded-2xl bg-forest p-6 text-on-forest">
          <p className="text-sm text-on-forest/70">Location</p>
          <p className="text-lg font-medium">
            {p.sharingLocation ? "Sharing live" : p.lastLocation ? "Last known position" : "Not shared yet"}
          </p>
          <p className="text-sm text-on-forest/75">
            {p.lastLocation
              ? `Updated at ${formatTime(p.lastLocation.recordedAt)} IST.`
              : "The volunteer shares their location once they start the trip."}
          </p>
        </div>
        <div className="grid gap-4 rounded-2xl border border-line bg-surface p-6">
          <div>
            <p className="text-sm text-muted">Collector</p>
            <p className="mt-1 font-medium">{p.collector.name}</p>
            <p className="text-sm text-muted">{p.collector.organizationName ?? roleLabel[p.collector.role]}</p>
          </div>
          {p.collector.phone && (
            <a href={`tel:${p.collector.phone.replace(/\s/g, "")}`} className={`${secondaryButton} w-fit px-4 py-2 text-sm`}>
              <PhoneIcon size={16} aria-hidden />
              Call {p.collector.name.split(" ")[0]}
            </a>
          )}
        </div>
      </aside>
    </div>
  );
}
