"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRightIcon,
  BicycleIcon,
  BuildingsIcon,
  CheckCircleIcon,
  CrosshairIcon,
  StorefrontIcon,
} from "@phosphor-icons/react";
import { ApiError, session } from "@/lib/api";
import type { Role } from "@/lib/types";
import { Field, FormAlert, Select, TextInput, primaryButton, secondaryButton } from "@/components/ui/form";
import { PhoneSignIn, phoneSignInEnabled } from "./PhoneSignIn";

type SignupRole = Exclude<Role, "ADMIN">;

const ROLES: { role: SignupRole; title: string; body: string; icon: typeof StorefrontIcon }[] = [
  { role: "DONOR", title: "Donor", body: "I have surplus food to give", icon: StorefrontIcon },
  { role: "VOLUNTEER", title: "Volunteer", body: "I can pick up and deliver", icon: BicycleIcon },
  { role: "NGO", title: "NGO", body: "We receive food for people in need", icon: BuildingsIcon },
];

const ORG_TYPES = ["Food bank", "Shelter", "Community kitchen", "Orphanage", "Old age home", "Other"];

type LocationState = { status: "idle" | "locating" | "set" | "error"; lat?: number; lng?: number; message?: string };

export function SignUpForm() {
  const router = useRouter();
  const [role, setRole] = useState<SignupRole>("DONOR");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    capacityServings: "",
    acceptsNonVeg: true,
    hasCoolBox: false,
    organizationName: "",
    organizationType: ORG_TYPES[0],
    address: "",
    opensAt: "",
    closesAt: "",
  });
  const [location, setLocation] = useState<LocationState>({ status: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  const isCollector = role === "VOLUNTEER" || role === "NGO";
  // Donors only ever sign up with a phone OTP: no email, password or organisation.
  const phoneDonor = role === "DONOR";
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));

  function locate() {
    if (!("geolocation" in navigator)) {
      setLocation({ status: "error", message: "This browser can't share location." });
      return;
    }
    setLocation({ status: "locating" });
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ status: "set", lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) =>
        setLocation({
          status: "error",
          message: err.code === err.PERMISSION_DENIED ? "Location permission was denied. You can add it later." : "Couldn't get your location. Try again.",
        }),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setFieldErrors({});
    const body = {
      role,
      name: form.name,
      email: form.email,
      password: form.password,
      phone: form.phone.trim() || null,
      latitude: location.status === "set" ? location.lat : null,
      longitude: location.status === "set" ? location.lng : null,
      ...(isCollector && {
        capacityServings: form.capacityServings ? Number(form.capacityServings) : null,
        acceptsNonVeg: form.acceptsNonVeg,
        hasCoolBox: form.hasCoolBox,
      }),
      ...(role === "NGO" && {
        opensAt: form.opensAt || null,
        closesAt: form.closesAt || null,
        organizationName: form.organizationName,
        organizationType: form.organizationType,
        address: form.address.trim() || null,
      }),
    };
    try {
      const { redirectTo } = await session<{ redirectTo: string }>("signup", body);
      router.replace(redirectTo);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.fieldErrors);
        setError(err.problem.status === 400 && Object.keys(err.fieldErrors).length ? "Some fields need fixing." : err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6" noValidate>
      <fieldset>
        <legend className="text-sm font-medium">I am joining as</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {ROLES.map((r) => {
            const selected = r.role === role;
            return (
              <label
                key={r.role}
                className={`relative flex cursor-pointer flex-col gap-2 rounded-2xl border p-4 transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent ${
                  selected ? "border-forest bg-forest text-on-forest" : "border-line bg-surface hover:border-ink/30"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={r.role}
                  checked={selected}
                  onChange={() => setRole(r.role)}
                  aria-label={`${r.title}: ${r.body}`}
                  className="sr-only"
                />
                <r.icon size={24} weight={selected ? "fill" : "duotone"} aria-hidden className={selected ? "" : "text-accent"} />
                <span className="font-semibold">{r.title}</span>
                <span className={`text-sm leading-snug ${selected ? "text-on-forest/75" : "text-muted"}`}>{r.body}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {error && <FormAlert>{error}</FormAlert>}

      {phoneDonor ? (
        <div className="grid gap-5">
          <Field id="name" label="Your name or business name" optional hint="Shown to the volunteer who collects your food.">
            <TextInput id="name" autoComplete="name" value={form.name} onChange={set("name")} />
          </Field>
          <div className="grid gap-3">
            <p className="text-sm text-muted">
              We&apos;ll text you a one-time code. No password, and no organisation details needed.
            </p>
            {phoneSignInEnabled ? (
              <PhoneSignIn name={form.name} />
            ) : (
              <FormAlert>Phone sign-up isn&apos;t set up on this server yet. Ask the admin to add the Phone.email client ID.</FormAlert>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-5">
            <Field id="name" label={role === "NGO" ? "Your name" : "Full name"} error={fieldErrors.name}>
              <TextInput id="name" autoComplete="name" required value={form.name} onChange={set("name")} error={fieldErrors.name} />
            </Field>
            <Field id="email" label="Email" error={fieldErrors.email}>
              <TextInput id="email" type="email" autoComplete="email" required value={form.email} onChange={set("email")} error={fieldErrors.email} />
            </Field>
            <Field id="password" label="Password" hint="At least 8 characters." error={fieldErrors.password}>
              <TextInput
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={form.password}
                onChange={set("password")}
                error={fieldErrors.password}
              />
            </Field>
            <Field id="phone" label="Phone" optional hint="Shared only with people on the same pickup." error={fieldErrors.phone}>
              <TextInput id="phone" type="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} error={fieldErrors.phone} />
            </Field>
          </div>

          {role === "NGO" && (
            <div className="grid gap-5 border-t border-line pt-6">
              <Field id="organizationName" label="Organization name" error={fieldErrors.organizationName}>
                <TextInput id="organizationName" required value={form.organizationName} onChange={set("organizationName")} error={fieldErrors.organizationName} />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="organizationType" label="Type">
                  <Select id="organizationType" value={form.organizationType} onChange={set("organizationType")}>
                    {ORG_TYPES.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </Select>
                </Field>
                <Field id="address" label="Area" optional error={fieldErrors.address}>
                  <TextInput id="address" autoComplete="street-address" value={form.address} onChange={set("address")} error={fieldErrors.address} />
                </Field>
              </div>
              <fieldset className="grid gap-2">
                <legend className="text-sm font-medium">
                  Hours you can receive food <span className="font-normal text-muted">(optional, IST)</span>
                </legend>
                <div className="grid grid-cols-2 gap-3">
                  <TextInput id="opensAt" type="time" aria-label="Opens at" value={form.opensAt} onChange={set("opensAt")} />
                  <TextInput id="closesAt" type="time" aria-label="Closes at" value={form.closesAt} onChange={set("closesAt")} />
                </div>
                <p className="text-sm text-muted">
                  Leave both empty if you can take food any time. Donors won&apos;t be matched with you while you&apos;re closed.
                </p>
              </fieldset>
            </div>
          )}

          {isCollector && (
            <div className="grid gap-5 border-t border-line pt-6">
              <Field
                id="capacityServings"
                label="How many servings can you carry or receive at once?"
                optional
                hint="Helps us match you with donations you can actually handle."
                error={fieldErrors.capacityServings}
              >
                <TextInput
                  id="capacityServings"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={10000}
                  value={form.capacityServings}
                  onChange={set("capacityServings")}
                  error={fieldErrors.capacityServings}
                />
              </Field>
              <label className="flex items-center gap-3 text-[15px]">
                <input
                  type="checkbox"
                  checked={form.acceptsNonVeg}
                  onChange={set("acceptsNonVeg")}
                  className="size-4 rounded border-line accent-[var(--forest)]"
                />
                {role === "NGO" ? "We can accept non-vegetarian food" : "I can carry non-vegetarian food"}
              </label>
              <label className="flex items-center gap-3 text-[15px]">
                <input
                  type="checkbox"
                  checked={form.hasCoolBox}
                  onChange={set("hasCoolBox")}
                  className="size-4 rounded border-line accent-[var(--forest)]"
                />
                {role === "NGO" ? "We have a fridge or cold storage for refrigerated food" : "I have a cool box for refrigerated food"}
              </label>
            </div>
          )}

          <div className="grid gap-3 border-t border-line pt-6">
            <p className="text-sm font-medium">
              Your location <span className="font-normal text-muted">{isCollector ? "(recommended)" : "(optional)"}</span>
            </p>
            <p className="text-sm text-muted">
              {isCollector
                ? "Used to find donations near you and rank matches by distance."
                : "Used as the default pickup spot. You can set a different one on each donation."}
            </p>
            {location.status === "set" ? (
              <p className="flex items-center gap-2 text-sm text-ink">
                <CheckCircleIcon size={18} weight="fill" className="text-forest dark:text-[#8fbf9f]" aria-hidden />
                Location saved
                <span className="font-mono text-muted">
                  {location.lat!.toFixed(4)}, {location.lng!.toFixed(4)}
                </span>
              </p>
            ) : (
              <div>
                <button type="button" onClick={locate} disabled={location.status === "locating"} className={secondaryButton}>
                  <CrosshairIcon size={18} aria-hidden />
                  {location.status === "locating" ? "Finding you..." : "Use my current location"}
                </button>
                {location.status === "error" && <p className="mt-2 text-sm text-accent">{location.message}</p>}
              </div>
            )}
          </div>

          <button type="submit" disabled={pending} className={`${primaryButton} w-full`}>
            {pending ? "Creating your account..." : "Create account"}
            {!pending && <ArrowRightIcon size={18} aria-hidden />}
          </button>
        </>
      )}
    </form>
  );
}
