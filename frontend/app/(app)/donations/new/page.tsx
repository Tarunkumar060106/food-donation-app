import type { Metadata } from "next";
import { DonationFormClient } from "@/components/donations/DonationFormClient";
import { DEFAULT_CENTER } from "@/lib/geo";
import { serverApi } from "@/lib/server-api";
import { requireSession } from "@/lib/session";
import type { User } from "@/lib/types";

export const metadata: Metadata = { title: "Post food | FoodRescue" };

export default async function NewDonationPage() {
  await requireSession(["DONOR"]);
  const me = await serverApi<User>("/auth/me");
  const location =
    me.latitude != null && me.longitude != null ? { lat: me.latitude, lng: me.longitude } : DEFAULT_CENTER;

  return (
    <div className="grid gap-10">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Post surplus food</h1>
        <p className="mt-2 text-muted">A few details and a pickup spot. It takes under a minute.</p>
      </div>
      <DonationFormClient defaultLocation={location} defaultAddress={me.organization?.address ?? ""} />
    </div>
  );
}
