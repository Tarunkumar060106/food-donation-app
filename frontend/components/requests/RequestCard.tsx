import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/ssr";
import { timeAgo } from "@/lib/format";
import type { MatchRequest, Role } from "@/lib/types";
import { RequestActions } from "./RequestActions";

const STATUS_TEXT: Record<MatchRequest["status"], string> = {
  PENDING: "Waiting",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  WITHDRAWN: "Withdrawn",
  CLOSED: "Closed",
};

/** One request or offer, worded from the viewer's side. */
export function RequestCard({ request: r, viewer, showFood = true }: { request: MatchRequest; viewer: Role; showFood?: boolean }) {
  const collectorName = r.collector.organizationName ?? r.collector.name;
  const headline =
    viewer === "DONOR"
      ? r.direction === "REQUEST"
        ? `${collectorName} asked for it`
        : `You offered it to ${collectorName}`
      : r.direction === "OFFER"
        ? `${r.donor.name} offered it to you`
        : "You asked for it";

  return (
    <div className="grid gap-3 rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {showFood && (
            <Link href={`/donations/${r.donation.id}`} className="block truncate text-lg font-medium hover:underline">
              {r.donation.foodName}
              <span className="ml-2 text-sm font-normal text-muted">{r.donation.servings} servings</span>
            </Link>
          )}
          <p className={showFood ? "text-sm text-muted" : "font-medium"}>
            {headline}, {timeAgo(r.createdAt)}
          </p>
        </div>
        {r.match && r.status === "PENDING" ? (
          <div className="text-right">
            <p className="font-mono text-xl font-medium tabular-nums">{r.match.score}%</p>
            <p className="text-xs text-muted">match</p>
          </div>
        ) : (
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              r.status === "ACCEPTED" ? "bg-forest text-on-forest" : r.status === "PENDING" ? "bg-sage text-ink" : "bg-line text-muted"
            }`}
          >
            {STATUS_TEXT[r.status]}
          </span>
        )}
      </div>

      {r.message && <p className="rounded-xl bg-sage/60 px-3.5 py-2.5 text-sm leading-relaxed">&ldquo;{r.message}&rdquo;</p>}
      {r.match && r.status === "PENDING" && viewer === "DONOR" && (
        <p className="text-sm text-muted">{r.match.reason.replace(/^\d+% match, /, "")}</p>
      )}
      {r.match && r.status === "PENDING" && !r.match.deliverable && (
        <p className="text-sm font-medium text-accent">
          {viewer === "DONOR"
            ? "Heads up: their centre closes before they could get this back in time."
            : "Your centre closes before you could get this back in time."}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <RequestActions request={r} compact />
        {r.pickupId && (
          <Link href={`/pickups/${r.pickupId}`} className="inline-flex items-center gap-1 text-sm font-medium">
            {viewer === "DONOR" ? "Track pickup" : "Open trip"}
            <ArrowRightIcon size={14} aria-hidden />
          </Link>
        )}
      </div>
    </div>
  );
}
