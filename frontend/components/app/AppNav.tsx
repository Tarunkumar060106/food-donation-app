"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { BowlFoodIcon, SignOutIcon, UserCircleIcon } from "@phosphor-icons/react";
import { session } from "@/lib/api";
import { roleLabel } from "@/lib/format";
import { NotificationBell, type NotificationFeed } from "./NotificationBell";
import type { Role } from "@/lib/types";

const NAV: Record<Role, { href: string; label: string }[]> = {
  DONOR: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/donations", label: "My donations" },
    { href: "/requests", label: "Requests" },
    { href: "/donations/new", label: "Post food" },
  ],
  VOLUNTEER: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/discover", label: "Discover" },
    { href: "/requests", label: "Requests" },
    { href: "/pickups", label: "My pickups" },
  ],
  NGO: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/discover", label: "Discover" },
    { href: "/requests", label: "Requests" },
    { href: "/pickups", label: "My pickups" },
  ],
  ADMIN: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/admin", label: "Operations" },
    { href: "/admin/users", label: "Users" },
  ],
};

export function AppNav({ name, role, notifications }: { name: string; role: Role; notifications: NotificationFeed | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const items = NAV[role];
  // Longest matching prefix wins, so "/donations/new" does not also light up "/donations".
  const activeHref = items
    .filter((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  async function signOut() {
    setSigningOut(true);
    await session("logout").catch(() => null);
    router.replace("/");
    router.refresh();
  }

  const links = items.map((i) => {
    const active = i.href === activeHref;
    return (
      <Link
        key={i.href}
        href={i.href}
        aria-current={active ? "page" : undefined}
        className={`shrink-0 rounded-full px-4 py-1.5 text-[15px] transition ${
          active ? "bg-forest text-on-forest" : "text-muted hover:text-ink"
        }`}
      >
        {i.label}
      </Link>
    );
  });

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink">
          <BowlFoodIcon size={26} weight="duotone" className="text-accent" aria-hidden />
          FoodRescue
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {links}
        </nav>
        <div className="flex items-center gap-3">
          <NotificationBell initial={notifications} />
          <Link
            href="/profile"
            aria-label="Your profile"
            className="hidden rounded-lg px-2 py-1 text-right leading-tight transition hover:bg-sage/60 sm:block"
          >
            <p className="text-sm font-medium">{name}</p>
            <p className="text-xs text-muted">{roleLabel[role]}</p>
          </Link>
          <Link
            href="/profile"
            aria-label="Your profile"
            className="flex size-9 items-center justify-center rounded-full border border-line text-muted transition hover:border-ink/40 hover:text-ink sm:hidden"
          >
            <UserCircleIcon size={18} aria-hidden />
          </Link>
          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            aria-label="Sign out"
            className="flex size-9 items-center justify-center rounded-full border border-line text-muted transition hover:border-ink/40 hover:text-ink disabled:opacity-60"
          >
            <SignOutIcon size={18} aria-hidden />
          </button>
        </div>
      </div>
      <nav aria-label="Main" className="flex gap-1 overflow-x-auto px-4 pb-3 md:hidden">
        {links}
      </nav>
    </header>
  );
}
