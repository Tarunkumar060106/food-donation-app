import type { Metadata } from "next";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { roleLabel } from "@/lib/format";
import { serverApi } from "@/lib/server-api";
import { requireSession } from "@/lib/session";
import type { User } from "@/lib/types";

export const metadata: Metadata = { title: "Profile | FoodRescue" };

export default async function ProfilePage() {
  await requireSession();
  const me = await serverApi<User>("/auth/me");

  return (
    <div className="grid gap-10">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Your profile</h1>
        <p className="mt-2 text-muted">
          {roleLabel[me.role]}
          {me.organization && `, ${me.organization.name}`}. Signed in with{" "}
          {me.phoneVerified ? `your phone ${me.phone}` : me.email}.
        </p>
      </div>
      <ProfileForm user={me} />
    </div>
  );
}
