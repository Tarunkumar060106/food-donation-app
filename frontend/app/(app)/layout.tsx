import { AppNav } from "@/components/app/AppNav";
import { requireSession } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  return (
    <div className="min-h-[100dvh]">
      <AppNav name={session.name} role={session.role} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-12 lg:px-8">{children}</main>
    </div>
  );
}
