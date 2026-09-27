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
  // Donors sign in with a phone OTP; volunteers, NGOs and admins with email and password.
  const [mode, setMode] = useState<"donor" | "team">(phoneSignInEnabled ? "donor" : "team");

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
      <div role="tablist" aria-label="Who is signing in" className="grid grid-cols-2 rounded-full border border-line bg-surface p-1">
        {(
          [
            ["donor", "Donating food"],
            ["team", "Volunteer, NGO or admin"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={mode === key}
            onClick={() => {
              setMode(key);
              setError(null);
              setFieldErrors({});
            }}
            className={`rounded-full px-3 py-2 text-sm transition ${mode === key ? "bg-forest text-on-forest" : "text-muted hover:text-ink"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "donor" ? (
        <div className="grid gap-4">
          <p className="text-sm text-muted">
            Enter your phone number and the code we text you. First time here? That creates your donor account.
          </p>
          {phoneSignInEnabled ? (
            <PhoneSignIn next={next} />
          ) : (
            <FormAlert>Phone sign-in isn&apos;t set up on this server yet.</FormAlert>
          )}
        </div>
      ) : (
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
      )}

      <div className="rounded-2xl border border-line bg-surface p-5">
        <p className="text-sm font-medium">Exploring the demo?</p>
        <p className="mt-1 text-sm text-muted">
          Fill in a demo account for any role. The demo donor uses email so you can try it without a phone.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {DEMO_ACCOUNTS.map((a) => (
            <button
              key={a.email}
              type="button"
              onClick={() => {
                setMode("team");
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
