import { CheckIcon } from "@phosphor-icons/react/ssr";
import { formatTime } from "@/lib/time";
import type { Pickup } from "@/lib/types";

const STEPS: { key: keyof Pickup; label: string }[] = [
  { key: "claimedAt", label: "Claimed" },
  { key: "arrivedAt", label: "Arrived" },
  { key: "pickedUpAt", label: "Picked up" },
  { key: "inTransitAt", label: "In transit" },
  { key: "deliveredAt", label: "Delivered" },
];

export function StatusTimeline({ pickup, surface = "plain" }: { pickup: Pickup; surface?: "plain" | "forest" }) {
  const onForest = surface === "forest";
  const cancelled = pickup.status === "CANCELLED";
  const currentIndex = STEPS.reduce((last, s, i) => (pickup[s.key] ? i : last), 0);

  return (
    <ol className="grid grid-cols-5 gap-2" aria-label="Pickup progress">
      {STEPS.map((s, i) => {
        const at = pickup[s.key] as string | null;
        const done = Boolean(at);
        const current = !cancelled && i === currentIndex + 1;
        const bar = done
          ? "bg-accent"
          : current
            ? onForest
              ? "bg-on-forest/40"
              : "bg-ink/25"
            : onForest
              ? "bg-on-forest/15"
              : "bg-line";
        return (
          <li key={s.key} aria-current={current ? "step" : undefined} className="min-w-0">
            <span className={`block h-1.5 rounded-full ${bar}`} aria-hidden />
            <p className={`mt-3 flex items-center gap-1 truncate text-sm font-medium ${done || current ? "" : onForest ? "text-on-forest/50" : "text-muted"}`}>
              {done && <CheckIcon size={12} weight="bold" className="shrink-0 text-accent" aria-hidden />}
              {s.label}
            </p>
            <p className={`font-mono text-xs tabular-nums ${onForest ? "text-on-forest/60" : "text-muted"}`}>
              {at ? formatTime(at) : current ? "Next" : ""}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
