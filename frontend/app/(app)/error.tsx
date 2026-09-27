"use client";

import Link from "next/link";
import { primaryButton, secondaryButton } from "@/components/ui/form";

/** Error boundary for signed-in pages, typically the API being unreachable. */
export default function AppError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="mx-auto grid max-w-xl justify-items-center gap-4 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Something went wrong</h1>
      <p className="text-muted">
        We couldn&apos;t load this page. The FoodRescue server may be restarting. Try again in a moment.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={() => retry()} className={primaryButton}>
          Try again
        </button>
        <Link href="/dashboard" className={secondaryButton}>
          Dashboard
        </Link>
      </div>
    </div>
  );
}
