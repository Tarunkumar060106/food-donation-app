import type { Metadata } from "next";
import { UsersTable } from "@/components/admin/UsersTable";
import { serverApi } from "@/lib/server-api";
import { requireSession } from "@/lib/session";
import type { User } from "@/lib/types";

export const metadata: Metadata = { title: "Users | FoodRescue" };

export default async function UsersPage() {
  await requireSession(["ADMIN"]);
  const users = await serverApi<User[]>("/admin/users");
  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Users</h1>
        <p className="mt-2 text-muted">Everyone on FoodRescue, newest first.</p>
      </div>
      <UsersTable users={users} />
    </div>
  );
}
