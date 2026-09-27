import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, SectionHeader } from "@/components/app/bits";
import { RequestCard } from "@/components/requests/RequestCard";
import { primaryButton } from "@/components/ui/form";
import { serverApi } from "@/lib/server-api";
import { requireSession } from "@/lib/session";
import type { MatchRequest } from "@/lib/types";

export const metadata: Metadata = { title: "Requests | FoodRescue" };

export default async function RequestsPage() {
  const session = await requireSession(["DONOR", "VOLUNTEER", "NGO"]);
  const all = await serverApi<MatchRequest[]>("/match-requests");
  const waitingForMe = all.filter((r) => r.awaitingMe);
  const sent = all.filter((r) => r.status === "PENDING" && r.sentByMe);
  const history = all.filter((r) => r.status !== "PENDING").slice(0, 20);
  const isDonor = session.role === "DONOR";

  return (
    <div className="grid gap-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Requests and offers</h1>
        <p className="mt-2 max-w-[60ch] text-muted">
          {isDonor
            ? "Collectors ask for your food here, and you can offer food to the best match. A pickup starts once both sides agree."
            : "Donors offer you food here, and you can ask for food from the feed. A pickup starts once both sides agree."}
        </p>
      </div>

      <section className="grid gap-4">
        <SectionHeader title={`Waiting for you${waitingForMe.length ? ` (${waitingForMe.length})` : ""}`} />
        {waitingForMe.length === 0 ? (
          <EmptyState
            title="Nothing to answer"
            body={isDonor ? "When a collector asks for your food, it shows up here." : "When a donor offers you food, it shows up here."}
            action={
              isDonor ? undefined : (
                <Link href="/discover" className={primaryButton}>
                  Find food nearby
                </Link>
              )
            }
          />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {waitingForMe.map((r) => (
              <li key={r.id}>
                <RequestCard request={r} viewer={session.role} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-4">
        <SectionHeader title={isDonor ? "Offers you sent" : "Requests you sent"} />
        {sent.length === 0 ? (
          <EmptyState
            title="Nothing pending"
            body={isDonor ? "Offer food from a donation's match list." : "Ask for food from any donation in the feed."}
          />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {sent.map((r) => (
              <li key={r.id}>
                <RequestCard request={r} viewer={session.role} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {history.length > 0 && (
        <section className="grid gap-4">
          <SectionHeader title="Earlier" />
          <ul className="grid gap-3 md:grid-cols-2">
            {history.map((r) => (
              <li key={r.id}>
                <RequestCard request={r} viewer={session.role} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
