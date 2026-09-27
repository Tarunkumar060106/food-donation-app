"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, api } from "@/lib/api";
import type { CollectorMatch, MatchRequest } from "@/lib/types";

const pill =
  "inline-flex items-center justify-center rounded-full px-3.5 py-1.5 text-sm font-medium transition active:scale-[0.98] disabled:opacity-60";

/** Donor side of a match row: offer the food, withdraw an offer, or accept a request from this collector. */
export function OfferButton({ donationId, match }: { donationId: string; match: CollectorMatch }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const open = match.pendingOffer?.status === "PENDING" ? match.pendingOffer : null;

  async function run(call: () => Promise<MatchRequest>) {
    setPending(true);
    setError(null);
    try {
      await call();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    }
    router.refresh();
    setPending(false);
  }

  const offer = () =>
    run(() => api(`/donations/${donationId}/offers`, { method: "POST", body: { collectorId: match.collector.id } }));
  const withdraw = (id: string) => run(() => api(`/match-requests/${id}/withdraw`, { method: "POST" }));
  const accept = (id: string) => run(() => api(`/match-requests/${id}/accept`, { method: "POST" }));

  return (
    <div className="flex flex-col items-end gap-1">
      {open?.direction === "OFFER" ? (
        <button type="button" disabled={pending} onClick={() => withdraw(open.id)} className={`${pill} border border-line text-muted hover:text-ink`}>
          {pending ? "..." : "Offered · Withdraw"}
        </button>
      ) : open?.direction === "REQUEST" ? (
        <button type="button" disabled={pending} onClick={() => accept(open.id)} className={`${pill} bg-accent text-on-accent hover:bg-accent-hover`}>
          {pending ? "Accepting..." : "Asked for it · Accept"}
        </button>
      ) : (
        <button type="button" disabled={pending} onClick={offer} className={`${pill} bg-forest text-on-forest hover:opacity-90`}>
          {pending ? "Offering..." : "Offer"}
        </button>
      )}
      {error && <p className="max-w-[24ch] text-right text-xs text-accent">{error}</p>}
    </div>
  );
}
