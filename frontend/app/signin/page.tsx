import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignInForm } from "@/components/auth/SignInForm";

export const metadata: Metadata = { title: "Sign in | FoodRescue" };

function safeNext(value: string | string[] | undefined) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : null;
}

export default async function SignInPage({ searchParams }: PageProps<"/signin">) {
  const { next } = await searchParams;
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to post food, pick up donations or track a delivery.">
      <SignInForm next={safeNext(next)} />
      <p className="mt-8 text-sm text-muted">
        New to FoodRescue?{" "}
        <Link href="/signup" className="font-medium text-ink underline decoration-line underline-offset-4 hover:decoration-ink">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
