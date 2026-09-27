"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowCounterClockwiseIcon } from "@phosphor-icons/react";
import { ApiError, api } from "@/lib/api";

/** Admin-only reset of demo activity. Shown when NEXT_PUBLIC_DEMO_TOOLS=true; the server also has to allow it. */
export function DemoTools() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function reset() {
    setPending(true);
    setMessage(null);
    try {
      const r = await api<{ donations: number; pickups: number; accounts: number }>("/admin/demo/reset", { method: "POST" });
      setMessage({ ok: true, text: `Fresh demo data: ${r.donations} donations and ${r.pickups} pickups. Accounts kept (${r.accounts}).` });
      router.refresh();
    } catch (err) {
      setMessage({ ok: false, text: err instanceof ApiError ? err.message : "Reset failed. Please try again." });
    } finally {
      setPending(false);
      setConfirming(false);
    }
  }

  return (
    <section className="grid gap-4 rounded-2xl border border-dashed border-line p-6">
      <div>
        <h2 className="text-lg font-semibold">Demo tools</h2>
        <p className="mt-1 max-w-[62ch] text-sm text-muted">
          Demo donations expire in real time. Reset before a presentation to get fresh donations, a pickup in transit and
          delivery history. This deletes all donations, pickups and notifications, but keeps every account.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {confirming ? (
          <>
            <span className="text-sm">Delete all activity and reseed?</span>
            <button type="button" onClick={() => setConfirming(false)} className="text-sm text-muted hover:text-ink">
              Cancel
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={pending}
              className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-on-accent transition active:scale-[0.98] disabled:opacity-60"
            >
              {pending ? "Resetting..." : "Yes, reset"}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm transition hover:border-ink/30"
          >
            <ArrowCounterClockwiseIcon size={16} aria-hidden />
            Reset demo data
          </button>
        )}
      </div>
      {message && (
        <p role="status" className={`text-sm ${message.ok ? "text-ink" : "text-accent"}`}>
          {message.text}
        </p>
      )}
    </section>
  );
}
