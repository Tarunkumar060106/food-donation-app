"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircleIcon, CrosshairIcon } from "@phosphor-icons/react";
import { ApiError, session } from "@/lib/api";
import type { User } from "@/lib/types";
import { Field, FormAlert, TextInput, primaryButton, secondaryButton } from "@/components/ui/form";

const hhmm = (t: string | null) => (t ? t.slice(0, 5) : "");

export function ProfileForm({ user }: { user: User }) {
  const router = useRouter();
  const isCollector = user.role === "VOLUNTEER" || user.role === "NGO";
  const [form, setForm] = useState({
    name: user.name,
    phone: user.phone ?? "",
    capacityServings: user.capacityServings?.toString() ?? "",
    acceptsNonVeg: user.acceptsNonVeg,
    hasCoolBox: user.hasCoolBox,
    opensAt: hhmm(user.opensAt),
    closesAt: hhmm(user.closesAt),
  });
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    user.latitude != null && user.longitude != null ? { lat: user.latitude, lng: user.longitude } : null,
  );
  const [locating, setLocating] = useState(false);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setSaved(false);
    setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  };

  function locate() {
    if (!("geolocation" in navigator)) return setError("This browser can't share location.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setSaved(false);
        setLocating(false);
      },
      () => {
        setError("Couldn't get your location. Check the browser permission and try again.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setFieldErrors({});
    if (Boolean(form.opensAt) !== Boolean(form.closesAt)) {
      setFieldErrors({ opensAt: "Set both times, or leave both empty." });
      setPending(false);
      return;
    }
    try {
      await session("profile", {
        name: form.name,
        phone: user.phoneVerified ? null : form.phone.trim() || null,
        latitude: location?.lat ?? null,
        longitude: location?.lng ?? null,
        capacityServings: form.capacityServings ? Number(form.capacityServings) : null,
        acceptsNonVeg: form.acceptsNonVeg,
        hasCoolBox: form.hasCoolBox,
        opensAt: form.opensAt || null,
        closesAt: form.closesAt || null,
      });
      setSaved(true);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.fieldErrors);
        setError(Object.keys(err.fieldErrors).length ? "Some fields need fixing." : err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
    setPending(false);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid max-w-2xl gap-8">
      {error && <FormAlert>{error}</FormAlert>}

      <section className="grid gap-5">
        <Field id="name" label={user.role === "NGO" ? "Your name" : "Name"} error={fieldErrors.name}>
          <TextInput id="name" autoComplete="name" required value={form.name} onChange={set("name")} error={fieldErrors.name} />
        </Field>
        <Field
          id="phone"
          label="Phone"
          optional={!user.phoneVerified}
          hint={user.phoneVerified ? "Verified by OTP. It's how you sign in, so it can't be changed here." : "Shared only with people on the same pickup."}
          error={fieldErrors.phone}
        >
          <TextInput
            id="phone"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={set("phone")}
            disabled={user.phoneVerified}
            error={fieldErrors.phone}
          />
        </Field>
      </section>

      {isCollector && (
        <section className="grid gap-5 border-t border-line pt-8">
          <h2 className="text-lg font-semibold">What you can take</h2>
          <Field id="capacityServings" label="Servings you can carry or receive at once" optional error={fieldErrors.capacityServings}>
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
            <input type="checkbox" checked={form.acceptsNonVeg} onChange={set("acceptsNonVeg")} className="size-4 accent-[var(--forest)]" />
            {user.role === "NGO" ? "We can accept non-vegetarian food" : "I can carry non-vegetarian food"}
          </label>
          <label className="flex items-center gap-3 text-[15px]">
            <input type="checkbox" checked={form.hasCoolBox} onChange={set("hasCoolBox")} className="size-4 accent-[var(--forest)]" />
            {user.role === "NGO" ? "We have a fridge or cold storage" : "I have a cool box for refrigerated food"}
          </label>
          <fieldset className="grid gap-2">
            <legend className="text-sm font-medium">
              {user.role === "NGO" ? "Hours you can receive food" : "Hours you're available"}{" "}
              <span className="font-normal text-muted">(optional, IST)</span>
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <TextInput id="opensAt" type="time" aria-label="Opens at" value={form.opensAt} onChange={set("opensAt")} error={fieldErrors.opensAt} />
              <TextInput id="closesAt" type="time" aria-label="Closes at" value={form.closesAt} onChange={set("closesAt")} />
            </div>
            {fieldErrors.opensAt ? (
              <p className="text-sm text-accent">{fieldErrors.opensAt}</p>
            ) : (
              <p className="text-sm text-muted">
                Leave both empty if you can take food any time. A closing time earlier than the opening time means overnight.
              </p>
            )}
          </fieldset>
        </section>
      )}

      <section className="grid gap-3 border-t border-line pt-8">
        <h2 className="text-lg font-semibold">Location</h2>
        <p className="text-sm text-muted">
          {isCollector
            ? "Used to rank donations by distance and to match you with food nearby."
            : "Used as the default pickup spot when you post food."}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={locate} disabled={locating} className={secondaryButton}>
            <CrosshairIcon size={18} aria-hidden />
            {locating ? "Finding you..." : location ? "Update to my current location" : "Use my current location"}
          </button>
          {location && (
            <>
              <span className="font-mono text-sm text-muted">
                {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </span>
              <button
                type="button"
                onClick={() => {
                  setLocation(null);
                  setSaved(false);
                }}
                className="text-sm text-muted underline decoration-line underline-offset-4 hover:text-ink"
              >
                Clear
              </button>
            </>
          )}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-4 border-t border-line pt-8">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Saving..." : "Save changes"}
        </button>
        {saved && (
          <p className="flex items-center gap-2 text-sm" role="status">
            <CheckCircleIcon size={18} weight="fill" className="text-forest dark:text-[#8fbf9f]" aria-hidden />
            Saved
          </p>
        )}
      </div>
    </form>
  );
}
