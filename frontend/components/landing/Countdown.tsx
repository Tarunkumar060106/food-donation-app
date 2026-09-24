"use client";

import { useEffect, useState } from "react";

const pad = (n: number) => n.toString().padStart(2, "0");

export function Countdown({ startSeconds }: { startSeconds: number }) {
  const [left, setLeft] = useState(startSeconds);

  useEffect(() => {
    const id = setInterval(() => {
      setLeft((s) => (s <= 1 ? startSeconds : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [startSeconds]);

  const h = Math.floor(left / 3600);
  const m = Math.floor((left % 3600) / 60);
  const s = left % 60;

  return (
    <span role="timer" className="font-mono tabular-nums" aria-label={`${h} hours ${m} minutes left`}>
      {pad(h)}:{pad(m)}:{pad(s)}
    </span>
  );
}
