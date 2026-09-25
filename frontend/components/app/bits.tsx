import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRightIcon } from "@phosphor-icons/react/ssr";
import { minutesLabel, statusLabel } from "@/lib/format";
import type { DonationStatus, PickupStatus, Urgency } from "@/lib/types";

const STATUS_TONE: Record<DonationStatus | PickupStatus, string> = {
  AVAILABLE: "bg-sage text-ink",
  CLAIMED: "bg-forest/10 text-forest dark:bg-forest dark:text-on-forest",
  ARRIVED: "bg-forest/10 text-forest dark:bg-forest dark:text-on-forest",
  PICKED_UP: "bg-forest text-on-forest",
  IN_TRANSIT: "bg-forest text-on-forest",
  DELIVERED: "bg-forest text-on-forest",
  EXPIRED: "bg-line text-muted",
  CANCELLED: "bg-line text-muted",
};

export function StatusBadge({ status }: { status: DonationStatus | PickupStatus }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_TONE[status]}`}>
      {statusLabel[status]}
    </span>
  );
}

export function TimeLeft({ minutes, urgency }: { minutes: number; urgency: Urgency | null }) {
  const tone = urgency === "CRITICAL" ? "text-accent" : urgency === "HIGH" ? "text-ink" : "text-muted";
  return <span className={`font-mono text-sm tabular-nums ${tone}`}>{minutesLabel(minutes)}</span>;
}

export function StatTile({ label, value, note, emphasis }: { label: string; value: string; note?: string; emphasis?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 sm:p-6 ${emphasis ? "bg-forest text-on-forest" : "border border-line bg-surface"}`}>
      <p className={`text-sm ${emphasis ? "text-on-forest/75" : "text-muted"}`}>{label}</p>
      <p className="mt-2 font-mono text-3xl font-medium tracking-tight tabular-nums md:text-4xl">{value}</p>
      {note && <p className={`mt-1 text-sm ${emphasis ? "text-on-forest/70" : "text-muted"}`}>{note}</p>}
    </div>
  );
}

export function SectionHeader({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {href && linkLabel && (
        <Link href={href} className="group inline-flex items-center gap-1 text-sm text-muted transition hover:text-ink">
          {linkLabel}
          <ArrowRightIcon size={14} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      )}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line px-6 py-10 text-center">
      <p className="font-medium">{title}</p>
      <p className="mx-auto mt-1 max-w-[42ch] text-sm text-muted">{body}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
