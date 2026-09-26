"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BellIcon } from "@phosphor-icons/react";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import type { Notification } from "@/lib/types";

const POLL_MS = 30_000;

export type NotificationFeed = { unreadCount: number; items: Notification[] };

/** `initial` is loaded with the page on the server, so the bell is correct on first paint and then polls. */
export function NotificationBell({ initial }: { initial: NotificationFeed | null }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[] | null>(initial?.items ?? null);
  const [unread, setUnread] = useState(initial?.unreadCount ?? 0);
  const [failed, setFailed] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const data = await api<NotificationFeed>("/notifications");
      setItems(data.items);
      setUnread(data.unreadCount);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (!document.hidden) void load();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function markRead(n: Notification) {
    if (n.readAt) return;
    setItems((list) => list?.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)) ?? null);
    setUnread((c) => Math.max(0, c - 1));
    await api(`/notifications/${n.id}/read`, { method: "PATCH" }).catch(() => load());
  }

  async function markAllRead() {
    const stamp = new Date().toISOString();
    setItems((list) => list?.map((x) => ({ ...x, readAt: x.readAt ?? stamp })) ?? null);
    setUnread(0);
    await api("/notifications/read-all", { method: "POST" }).catch(() => load());
  }

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          if (!open) void load();
        }}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        className="relative flex size-9 items-center justify-center rounded-full border border-line text-muted transition hover:border-ink/40 hover:text-ink"
      >
        <BellIcon size={18} aria-hidden />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 font-mono text-[10px] leading-none font-medium text-on-accent">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute top-full right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_24px_60px_-20px_rgb(var(--shadow)/0.45)]"
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="font-medium">Notifications</p>
            {unread > 0 && (
              <button type="button" onClick={markAllRead} className="text-sm text-muted hover:text-ink">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[min(26rem,70dvh)] overflow-y-auto">
            {items === null ? (
              <div className="grid gap-3 p-4" aria-label="Loading notifications">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded-[10px] bg-sage" />
                ))}
              </div>
            ) : failed && items.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted">Couldn&apos;t load notifications.</p>
            ) : items.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted">You&apos;re all caught up.</p>
            ) : (
              <ul className="divide-y divide-line">
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => markRead(n)}
                      className={`flex w-full gap-3 px-4 py-3 text-left transition hover:bg-sage/50 ${n.readAt ? "" : "bg-sage/30"}`}
                    >
                      <span
                        className={`mt-1.5 size-2 shrink-0 rounded-full ${n.readAt ? "bg-transparent" : "bg-accent"}`}
                        aria-label={n.readAt ? undefined : "Unread"}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">{n.title}</span>
                        <span className="block text-sm text-muted">{n.message}</span>
                        <span className="mt-0.5 block text-xs text-muted">{timeAgo(n.createdAt)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
