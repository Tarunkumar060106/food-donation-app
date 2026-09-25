import type { MatchResult, ScoreComponent } from "@/lib/types";

type Surface = "plain" | "forest";

const LABELS: Record<ScoreComponent["signal"], string> = {
  urgency: "Urgency",
  distance: "Distance",
  capacity: "Capacity",
  food: "Food fit",
};

const TONES: Record<Surface, Record<ScoreComponent["signal"], string>> = {
  plain: {
    urgency: "bg-accent",
    distance: "bg-forest dark:bg-[#8fbf9f]",
    capacity: "bg-[#8fbf9f] dark:bg-on-forest/60",
    food: "bg-muted/50",
  },
  forest: {
    urgency: "bg-accent",
    distance: "bg-[#8fbf9f]",
    capacity: "bg-on-forest/60",
    food: "bg-on-forest/30",
  },
};

export function MatchBreakdown({ match, compact = false, surface = "plain" }: { match: MatchResult; compact?: boolean; surface?: Surface }) {
  const tones = TONES[surface];
  const muted = surface === "forest" ? "text-on-forest/70" : "text-muted";
  return (
    <div className="grid gap-3">
      <div className="flex h-2 w-full gap-0.5" aria-hidden>
        {match.breakdown.map((p) => (
          <span key={p.signal} className={`h-full rounded-full ${tones[p.signal]}`} style={{ width: `${p.points}%` }} />
        ))}
      </div>
      {!compact && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
          {match.breakdown.map((p) => (
            <div key={p.signal}>
              <dt className={`flex items-center gap-1.5 text-xs ${muted}`}>
                <span className={`size-2 rounded-full ${tones[p.signal]}`} aria-hidden />
                {LABELS[p.signal]}
              </dt>
              <dd className="font-mono text-sm tabular-nums">
                {Math.round(p.points)}
                <span className={muted}> / {p.weight}</span>
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
