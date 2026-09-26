"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowClockwiseIcon } from "@phosphor-icons/react";
import { formatTime } from "@/lib/time";

/** Re-fetches the server-rendered page on an interval, pausing while the tab is hidden. */
export function AutoRefresh({ everyMs = 15_000, renderedAt }: { everyMs?: number; renderedAt: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => startTransition(() => router.refresh()), everyMs);
    return () => clearInterval(id);
  }, [paused, everyMs, router]);

  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      className="inline-flex items-center gap-2 rounded-full border border-line px-3.5 py-1.5 text-sm text-muted transition hover:border-ink/30 hover:text-ink"
      title="Refreshes automatically every 15 seconds"
    >
      <ArrowClockwiseIcon size={15} className={pending ? "animate-spin motion-reduce:animate-none" : ""} aria-hidden />
      <span suppressHydrationWarning>Updated {formatTime(renderedAt)}</span>
    </button>
  );
}
