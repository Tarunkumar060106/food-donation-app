"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, api } from "@/lib/api";

/** Two-step button for destructive admin actions: click, confirm, then call the API and refresh. */
export function ConfirmAction({
  label,
  question,
  confirmLabel,
  method,
  path,
  body,
}: {
  label: string;
  question: string;
  confirmLabel: string;
  method: "POST" | "PATCH";
  path: string;
  body?: unknown;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setPending(true);
    setError(null);
    try {
      await api(path, { method, body });
      setConfirming(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "That didn't work. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (!confirming) {
    return (
      <div className="grid justify-items-end gap-1">
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="rounded-full border border-line px-3 py-1 text-xs text-muted transition hover:border-accent/50 hover:text-accent"
        >
          {label}
        </button>
        {error && <p className="text-xs text-accent">{error}</p>}
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 text-xs">
      <span className="text-muted">{question}</span>
      <button type="button" onClick={() => setConfirming(false)} className="px-1 text-muted hover:text-ink">
        No
      </button>
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="rounded-full bg-accent px-3 py-1 font-medium text-on-accent transition active:scale-[0.98] disabled:opacity-60"
      >
        {pending ? "Working..." : confirmLabel}
      </button>
    </div>
  );
}
