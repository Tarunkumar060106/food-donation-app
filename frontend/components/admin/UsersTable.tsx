"use client";

import { useMemo, useState } from "react";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { roleLabel } from "@/lib/format";
import { formatDateTime } from "@/lib/time";
import type { Role, User } from "@/lib/types";
import { EmptyState } from "@/components/app/bits";

const ROLES: (Role | "ALL")[] = ["ALL", "DONOR", "VOLUNTEER", "NGO", "ADMIN"];

export function UsersTable({ users }: { users: User[] }) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<Role | "ALL">("ALL");

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: users.length };
    for (const u of users) c[u.role] = (c[u.role] ?? 0) + 1;
    return c;
  }, [users]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter(
      (u) =>
        (role === "ALL" || u.role === role) &&
        (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.organization?.name.toLowerCase().includes(q)),
    );
  }, [users, query, role]);

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <div role="radiogroup" aria-label="Role" className="flex flex-wrap rounded-full border border-line bg-surface p-1">
          {ROLES.map((r) => {
            const on = r === role;
            return (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setRole(r)}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition ${on ? "bg-forest text-on-forest" : "text-muted hover:text-ink"}`}
              >
                {r === "ALL" ? "Everyone" : `${roleLabel[r]}s`}
                <span className={`font-mono text-xs ${on ? "text-on-forest/70" : "text-muted"}`}>{counts[r] ?? 0}</span>
              </button>
            );
          })}
        </div>
        <label className="relative ml-auto w-full sm:w-72">
          <span className="sr-only">Search users</span>
          <MagnifyingGlassIcon size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email or organization"
            className="w-full rounded-full border border-line bg-surface py-2 pr-4 pl-10 text-sm text-ink placeholder:text-muted focus:border-forest focus:ring-2 focus:ring-forest/20 focus:outline-none"
          />
        </label>
      </div>

      {shown.length === 0 ? (
        <EmptyState title="No users match" body="Try a different name or role." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr>
                <th scope="col" className="px-5 py-3 font-medium">Name</th>
                <th scope="col" className="px-5 py-3 font-medium">Role</th>
                <th scope="col" className="px-5 py-3 font-medium">Contact</th>
                <th scope="col" className="px-5 py-3 font-medium">Capacity</th>
                <th scope="col" className="px-5 py-3 font-medium">Location</th>
                <th scope="col" className="px-5 py-3 font-medium">Joined (IST)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {shown.map((u) => (
                <tr key={u.id} className="align-top">
                  <td className="px-5 py-3.5">
                    <p className="font-medium">{u.name}</p>
                    {u.organization && <p className="text-muted">{u.organization.name}</p>}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="rounded-full bg-sage px-2.5 py-0.5 text-xs font-medium">{roleLabel[u.role]}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <p>{u.email}</p>
                    {u.phone && <p className="font-mono text-xs text-muted">{u.phone}</p>}
                  </td>
                  <td className="px-5 py-3.5 font-mono tabular-nums">
                    {u.capacityServings ?? <span className="text-muted">-</span>}
                    {u.role !== "DONOR" && u.role !== "ADMIN" && !u.acceptsNonVeg && <p className="font-sans text-xs text-muted">Veg only</p>}
                  </td>
                  <td className="px-5 py-3.5 text-muted">{u.latitude != null ? "Saved" : "Not set"}</td>
                  <td className="px-5 py-3.5 font-mono text-xs tabular-nums text-muted">{formatDateTime(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
