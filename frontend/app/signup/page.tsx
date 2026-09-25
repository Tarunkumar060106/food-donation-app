import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignUpForm } from "@/components/auth/SignUpForm";

export const metadata: Metadata = { title: "Create an account | FoodRescue" };

export default function SignUpPage() {
  return (
    <AuthShell title="Join FoodRescue" subtitle="Tell us how you'd like to help. It takes about a minute.">
      <SignUpForm />
      <p className="mt-8 text-sm text-muted">
        Already have an account?{" "}
        <Link href="/signin" className="font-medium text-ink underline decoration-line underline-offset-4 hover:decoration-ink">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
