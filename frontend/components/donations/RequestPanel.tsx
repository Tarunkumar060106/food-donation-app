"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, HandHeartIcon, HourglassMediumIcon, WarningIcon } from "@phosphor-icons/react";
import { ApiError, api } from "@/lib/api";
import type { Donation, MatchRequest } from "@/lib/types";
import { FormAlert, primaryButton } from "@/components/ui/form";
import { MatchBreakdown } from "./MatchBreakdown";

const ghostOnForest =
  "inline-flex items-center justify-center gap-2 rounded-full border border-on-forest/30 px-5 py-2.5 font-medium text-on-forest transition hover:border-on-forest/60 active:scale-[0.98] disabled:opacity-60";

/**
 * Collector side of mutual acceptance: ask the donor for the food, or answer the donor's offer.
 * Nothing is collected until the other side agrees.
 */
export function RequestPanel({ donation }: { donation: Donation }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const match = donation.match;
  const mine = donation.myRequest?.status === "PENDING" ? donation.myRequest : null;

  async function run(label: string, call: () => Promise<MatchRequest>) {
    setPending(label);
    setError(null);
    try {
      const result = await call();
      if (result.pickupId) {
        router.push(`/pickups/${result.pickupId}`);
        return;
      }
      router.refresh();
      setPending(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setPending(null);
      router.refresh();
    }
  }

  const send = () =>
    run("send", () =>
      api<MatchRequest>(`/donations/${donation.id}/requests`, { method: "POST", body: { message: message.trim() || null } }),
    );
  const act = (id: string, action: "accept" | "decline" | "withdraw") =>
    run(action, () => api<MatchRequest>(`/match-requests/${id}/${action}`, { method: "POST" }));

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

      {match && !match.deliverable && (
        <p className="flex items-start gap-2 rounded-xl bg-on-forest/10 px-4 py-3 text-sm">
          <WarningIcon size={18} className="mt-0.5 shrink-0" aria-hidden />
          Your centre is closed until after this food expires, so it couldn&apos;t be received in time.
        </p>
      )}

      {error && (
        <div className="text-ink">
          <FormAlert>{error}</FormAlert>
        </div>
      )}

      {mine?.direction === "OFFER" ? (
        <div className="grid gap-4">
          <p className="flex items-center gap-2 text-lg font-medium">
            <HandHeartIcon size={22} weight="duotone" aria-hidden />
            {donation.donor.name} offered this to you
          </p>
          <p className="text-sm text-on-forest/75">Accept to start the pickup. Declining lets them offer it to someone else.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => act(mine.id, "accept")} disabled={pending !== null} className={primaryButton}>
              <CheckIcon size={18} aria-hidden />
              {pending === "accept" ? "Accepting..." : "Accept and collect"}
            </button>
            <button type="button" onClick={() => act(mine.id, "decline")} disabled={pending !== null} className={ghostOnForest}>
              {pending === "decline" ? "Declining..." : "Decline"}
            </button>
          </div>
        </div>
      ) : mine?.direction === "REQUEST" ? (
        <div className="grid gap-4">
          <p className="flex items-center gap-2 text-lg font-medium">
            <HourglassMediumIcon size={22} weight="duotone" aria-hidden />
            Waiting for {donation.donor.name}
          </p>
          <p className="text-sm text-on-forest/75">
            You asked for this food. You&apos;ll get a notification the moment they accept, and the trip opens then.
          </p>
          <button type="button" onClick={() => act(mine.id, "withdraw")} disabled={pending !== null} className={ghostOnForest}>
            {pending === "withdraw" ? "Withdrawing..." : "Withdraw request"}
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          <label className="grid gap-2 text-sm">
            <span className="text-on-forest/80">
              Note to the donor <span className="text-on-forest/60">(optional)</span>
            </span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={300}
              rows={2}
              placeholder="e.g. I can be there in 15 minutes with a cool box."
              className="w-full resize-none rounded-[10px] border border-on-forest/25 bg-on-forest/10 px-3.5 py-2.5 text-[15px] text-on-forest placeholder:text-on-forest/50 focus:border-on-forest/60 focus:outline-none"
            />
          </label>
          <button type="button" onClick={send} disabled={pending !== null} className={`${primaryButton} w-full`}>
            <HandHeartIcon size={18} aria-hidden />
            {pending === "send" ? "Sending..." : "Request this food"}
          </button>
          <p className="text-center text-sm text-on-forest/70">
            The donor accepts before anyone heads over. You&apos;ll share your location only after you start the trip.
          </p>
        </div>
      )}
    </div>
  );
}
