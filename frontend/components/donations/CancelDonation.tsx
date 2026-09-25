"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, api } from "@/lib/api";
import { FormAlert, secondaryButton } from "@/components/ui/form";

export function CancelDonation({ donationId }: { donationId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancel() {
    setPending(true);
    setError(null);
    try {
      await api(`/donations/${donationId}/cancel`, { method: "POST" });
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't cancel. Please try again.");
    } finally {
      setPending(false);
      setConfirming(false);
    }
  }

  return (
    <div className="grid gap-3">
      {error && <FormAlert>{error}</FormAlert>}
      {confirming ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line p-4">
          <p className="flex-1 text-sm">Take this donation off the feed?</p>
          <button type="button" onClick={() => setConfirming(false)} className="text-sm text-muted hover:text-ink">
            Keep it
          </button>
          <button
            type="button"
            onClick={cancel}
            disabled={pending}
            className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-bg transition active:scale-[0.98] disabled:opacity-60"
          >
            {pending ? "Cancelling..." : "Yes, cancel"}
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setConfirming(true)} className={`${secondaryButton} w-full text-muted`}>
          Cancel donation
        </button>
      )}
    </div>
  );
}
