"use client";

import { useEffect, useState } from "react";

const pad = (n: number) => String(n).padStart(2, "0");

/** Ticks down to `until`. Server and client clocks differ by a second or two, hence suppressHydrationWarning. */
export function LiveCountdown({ until, className = "" }: { until: string; className?: string }) {
  const target = new Date(until).getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const left = Math.max(0, Math.floor((target - now) / 1000));
  const days = Math.floor(left / 86400);
  const text =
    left === 0
      ? "00:00:00"
      : days >= 1
        ? `${days}d ${pad(Math.floor((left % 86400) / 3600))}h`
        : `${pad(Math.floor(left / 3600))}:${pad(Math.floor((left % 3600) / 60))}:${pad(left % 60)}`;

  return (
    <span role="timer" suppressHydrationWarning className={`font-mono tabular-nums ${className}`}>
      {text}
    </span>
  );
}
