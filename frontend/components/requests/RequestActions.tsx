"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon } from "@phosphor-icons/react";
import { ApiError, api } from "@/lib/api";
import type { MatchRequest } from "@/lib/types";
import { primaryButton, secondaryButton } from "@/components/ui/form";

/** Accept or decline what was sent to you, or withdraw what you sent. */
export function RequestActions({ request, compact }: { request: MatchRequest; compact?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const size = compact ? "px-4 py-2 text-sm" : "";

  async function act(action: "accept" | "decline" | "withdraw") {
    setPending(action);
    setError(null);
    try {
      const result = await api<MatchRequest>(`/match-requests/${request.id}/${action}`, { method: "POST" });
      // Collectors go straight to the trip; donors stay and see the pickup appear.
      if (result.pickupId && request.direction === "OFFER") {
        router.push(`/pickups/${result.pickupId}`);
        return;
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      router.refresh();
    }
    setPending(null);
  }

  if (request.status !== "PENDING") return null;
  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        {request.awaitingMe && (
          <>
            <button type="button" onClick={() => act("accept")} disabled={pending !== null} className={`${primaryButton} ${size}`}>
              <CheckIcon size={16} aria-hidden />
              {pending === "accept" ? "Accepting..." : request.direction === "REQUEST" ? "Accept" : "Accept and collect"}
            </button>
            <button type="button" onClick={() => act("decline")} disabled={pending !== null} className={`${secondaryButton} ${size}`}>
              {pending === "decline" ? "Declining..." : "Decline"}
            </button>
          </>
        )}
        {request.sentByMe && (
          <button type="button" onClick={() => act("withdraw")} disabled={pending !== null} className={`${secondaryButton} ${size}`}>
            {pending === "withdraw" ? "Withdrawing..." : "Withdraw"}
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-accent">
          {error}
        </p>
      )}
    </div>
  );
}
