"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HandGrabbingIcon } from "@phosphor-icons/react";
import { ApiError, api } from "@/lib/api";
import type { Donation, Pickup } from "@/lib/types";
import { FormAlert, primaryButton } from "@/components/ui/form";
import { MatchBreakdown } from "./MatchBreakdown";

export function ClaimPanel({ donation }: { donation: Donation }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const match = donation.match;

  async function claim() {
    setPending(true);
    setError(null);
    try {
      const pickup = await api<Pickup>(`/donations/${donation.id}/claim`, { method: "POST" });
      router.push(`/pickups/${pickup.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't claim this donation. Please try again.");
      setPending(false);
      router.refresh();
    }
  }

  return (
    <div className="grid gap-6 rounded-2xl bg-forest p-6 text-on-forest sm:p-8">
      {match && (
        <div>
          <p className="text-sm text-on-forest/70">Your match</p>
          <p className="mt-1 font-mono text-6xl font-medium tracking-tight tabular-nums">{match.score}%</p>
          <p className="mt-2 text-sm leading-relaxed text-on-forest/80">{match.reason}</p>
          <div className="mt-5">
            <MatchBreakdown match={match} surface="forest" />
          </div>
        </div>
      )}
      {error && (
        <div className="text-ink">
          <FormAlert>{error}</FormAlert>
        </div>
      )}
      <button type="button" onClick={claim} disabled={pending} className={`${primaryButton} w-full`}>
        <HandGrabbingIcon size={18} aria-hidden />
        {pending ? "Claiming..." : "Claim this pickup"}
      </button>
      <p className="text-center text-sm text-on-forest/70">You&apos;ll share your location only after you start the trip.</p>
    </div>
  );
}
