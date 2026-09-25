import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { StatusBadge } from "@/components/app/bits";
import { LiveTracker } from "@/components/pickups/LiveTracker";
import { TripConsole } from "@/components/pickups/TripConsole";
import { ApiError, serverApi } from "@/lib/server-api";
import { requireSession } from "@/lib/session";
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
  const back = isCollector
    ? { href: "/pickups", label: "My pickups" }
    : session.role === "ADMIN"
      ? { href: "/admin", label: "Operations" }
      : { href: `/donations/${p.donationId}`, label: "Donation" };

  return (
    <div className="grid gap-8">
      <Link href={back.href} className="inline-flex w-fit items-center gap-1.5 text-sm text-muted transition hover:text-ink">
        <ArrowLeftIcon size={14} aria-hidden />
        {back.label}
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

      {isCollector ? (
        <TripConsole initial={tracking} demoTools={process.env.NEXT_PUBLIC_DEMO_TOOLS === "true"} />
      ) : (
        <LiveTracker initial={tracking} />
      )}
    </div>
  );
}
