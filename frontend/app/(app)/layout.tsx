import { AppNav } from "@/components/app/AppNav";
import type { NotificationFeed } from "@/components/app/NotificationBell";
import { serverApi } from "@/lib/server-api";
import { requireSession } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  // The bell is a nicety; a failed load must never block the page.
  const notifications = await serverApi<NotificationFeed>("/notifications").catch(() => null);
  return (
    <div className="min-h-[100dvh]">
      <AppNav name={session.name} role={session.role} notifications={notifications} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-12 lg:px-8">{children}</main>
    </div>
  );
}
