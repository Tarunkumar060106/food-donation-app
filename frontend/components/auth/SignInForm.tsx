"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { ApiError, session } from "@/lib/api";
import { Field, FormAlert, TextInput, primaryButton } from "@/components/ui/form";
import { PhoneSignIn, phoneSignInEnabled } from "./PhoneSignIn";

const DEMO_ACCOUNTS = [
  { label: "Donor", email: "donor@foodrescue.dev" },
  { label: "Volunteer", email: "volunteer@foodrescue.dev" },
  { label: "NGO", email: "ngo@foodrescue.dev" },
  { label: "Admin", email: "admin@foodrescue.dev" },
];
const DEMO_PASSWORD = "demo12345";

export function SignInForm({ next }: { next: string | null }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setFieldErrors({});
    try {
      const { redirectTo } = await session<{ redirectTo: string }>("login", { email, password });
      router.replace(next ?? redirectTo);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.fieldErrors);
        setError(err.problem.status === 400 ? null : err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
      setPending(false);
    }
  }

  return (
    <div className="grid gap-8">
      <form onSubmit={onSubmit} className="grid gap-5" noValidate>
        {error && <FormAlert>{error}</FormAlert>}
        <Field id="email" label="Email" error={fieldErrors.email}>
          <TextInput
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
          />
        </Field>
        <Field id="password" label="Password" error={fieldErrors.password}>
          <TextInput
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
          />
        </Field>
        <button type="submit" disabled={pending} className={`${primaryButton} mt-2 w-full`}>
          {pending ? "Signing in..." : "Sign in"}
          {!pending && <ArrowRightIcon size={18} aria-hidden />}
        </button>
      </form>

      {phoneSignInEnabled && (
        <div className="grid gap-4">
          <div className="flex items-center gap-3 text-sm text-muted">
            <span className="h-px flex-1 bg-line" />
            Donating food? Sign in with your phone
            <span className="h-px flex-1 bg-line" />
          </div>
          <PhoneSignIn next={next} />
        </div>
      )}

      <div className="rounded-2xl border border-line bg-surface p-5">
        <p className="text-sm font-medium">Exploring the demo?</p>
        <p className="mt-1 text-sm text-muted">Fill in a demo account for any role.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {DEMO_ACCOUNTS.map((a) => (
            <button
              key={a.email}
              type="button"
              onClick={() => {
                setEmail(a.email);
                setPassword(DEMO_PASSWORD);
                setError(null);
                setFieldErrors({});
              }}
              className="rounded-full border border-line bg-bg px-4 py-1.5 text-sm text-ink transition hover:border-forest active:scale-[0.98]"
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
