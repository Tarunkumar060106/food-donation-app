import { CookingPotIcon, SnowflakeIcon } from "@phosphor-icons/react/ssr";
import { timeAgo } from "@/lib/format";
import { formatTime } from "@/lib/time";

/** "Keep refrigerated" and "Cooked 2 hours ago", shown wherever a donation is described. */
export function FoodSafetyBadges({
  preparedAt,
  requiresRefrigeration,
  showTime = false,
}: {
  preparedAt: string | null;
  requiresRefrigeration: boolean;
  /** Adds the clock time: "Cooked 2 hours ago (5:30 pm)". */
  showTime?: boolean;
}) {
  if (!preparedAt && !requiresRefrigeration) return null;
  return (
    <span className="flex flex-wrap items-center gap-2">
      {requiresRefrigeration && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-forest/30 bg-forest/10 px-2.5 py-0.5 text-xs font-medium text-forest dark:border-[#8fbf9f]/40 dark:bg-[#8fbf9f]/10 dark:text-[#8fbf9f]">
          <SnowflakeIcon size={13} weight="bold" aria-hidden />
          Keep refrigerated
        </span>
      )}
      {preparedAt && (
        <span className="inline-flex items-center gap-1.5 text-xs text-muted">
          <CookingPotIcon size={14} aria-hidden />
          <span suppressHydrationWarning>
            Cooked {timeAgo(preparedAt)}
            {showTime && ` (${formatTime(preparedAt)} IST)`}
          </span>
        </span>
      )}
    </span>
  );
}
