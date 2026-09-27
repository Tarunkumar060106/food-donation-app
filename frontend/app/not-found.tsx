import type { Metadata } from "next";
import Link from "next/link";
import { BowlFoodIcon } from "@phosphor-icons/react/ssr";
import { primaryButton, secondaryButton } from "@/components/ui/form";

export const metadata: Metadata = { title: "Not found | FoodRescue" };

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <BowlFoodIcon size={40} weight="duotone" className="text-accent" aria-hidden />
      <h1 className="mt-6 text-3xl font-semibold tracking-tight md:text-4xl">We couldn&apos;t find that</h1>
      <p className="mt-3 text-muted">
        The page may have moved, or the donation or pickup isn&apos;t one you have access to.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/dashboard" className={primaryButton}>
          Go to your dashboard
        </Link>
        <Link href="/" className={secondaryButton}>
          Home
        </Link>
      </div>
    </main>
  );
}
