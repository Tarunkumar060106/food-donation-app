"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, CrosshairIcon } from "@phosphor-icons/react";
import { ApiError, api } from "@/lib/api";
import { categoryLabel } from "@/lib/format";
import { APP_TIME_ZONE_LABEL, fromIstInput, istInputInMinutes } from "@/lib/time";
import type { Dietary, Donation, FoodCategory } from "@/lib/types";
import { LocationPickerMap, type LatLng } from "@/components/map";
import { Field, FormAlert, Select, TextInput, inputClass, primaryButton, secondaryButton } from "@/components/ui/form";

const CATEGORIES = Object.keys(categoryLabel) as FoodCategory[];
const EXPIRY_PRESETS = [
  { label: "1 hour", minutes: 60 },
  { label: "2 hours", minutes: 120 },
  { label: "4 hours", minutes: 240 },
  { label: "12 hours", minutes: 720 },
];

const inMinutes = istInputInMinutes;

export function DonationForm({ defaultLocation, defaultAddress }: { defaultLocation: LatLng; defaultAddress: string }) {
  const router = useRouter();
  const [form, setForm] = useState({
    foodName: "",
    category: "COOKED_MEAL" as FoodCategory,
    dietary: "VEG" as Dietary,
    servings: "",
    quantityDescription: "",
    description: "",
    pickupAddress: defaultAddress,
    // Uses the viewer's clock; safe because this form only renders in the browser.
    pickupDeadline: inMinutes(60),
    expiryTime: inMinutes(120),
  });
  const [pin, setPin] = useState<LatLng>(defaultLocation);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));
  const onPinChange = useCallback((p: LatLng) => setPin(p), []);

  function locateMe() {
    if (!("geolocation" in navigator)) return setError("This browser can't share location.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setError("Couldn't get your location. Drag the pin or click the map instead.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function validate() {
    const errs: Record<string, string> = {};
    const deadline = fromIstInput(form.pickupDeadline);
    const expiry = fromIstInput(form.expiryTime);
    if (!form.foodName.trim()) errs.foodName = "Tell volunteers what the food is.";
    if (!form.servings || Number(form.servings) < 1) errs.servings = "Enter how many people this can feed.";
    if (!form.pickupAddress.trim()) errs.pickupAddress = "Add an address or landmark for the pickup.";
    if (Number.isNaN(deadline.getTime()) || deadline <= new Date()) errs.pickupDeadline = "Pick a time in the future.";
    if (Number.isNaN(expiry.getTime()) || expiry <= new Date()) errs.expiryTime = "Pick a time in the future.";
    else if (!errs.pickupDeadline && deadline > expiry) errs.pickupDeadline = "Pickup must happen before the food expires.";
    return errs;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    setPending(true);
    try {
      const created = await api<Donation>("/donations", {
        method: "POST",
        body: {
          foodName: form.foodName.trim(),
          category: form.category,
          dietary: form.dietary,
          servings: Number(form.servings),
          quantityDescription: form.quantityDescription.trim() || null,
          description: form.description.trim() || null,
          pickupAddress: form.pickupAddress.trim(),
          pickupLat: pin.lat,
          pickupLng: pin.lng,
          pickupDeadline: fromIstInput(form.pickupDeadline).toISOString(),
          expiryTime: fromIstInput(form.expiryTime).toISOString(),
        },
      });
      router.push(`/donations/${created.id}`);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.fieldErrors);
        setError(Object.keys(err.fieldErrors).length ? "Some fields need fixing." : err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-10 lg:grid-cols-12 lg:gap-12">
      <div className="grid content-start gap-8 lg:col-span-6">
        {error && <FormAlert>{error}</FormAlert>}

        <section className="grid gap-5">
          <h2 className="text-lg font-semibold">The food</h2>
          <Field id="foodName" label="What is it?" hint="For example: vegetable biryani, bread and buns." error={fieldErrors.foodName}>
            <TextInput id="foodName" required maxLength={120} value={form.foodName} onChange={set("foodName")} error={fieldErrors.foodName} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="category" label="Category">
              <Select id="category" value={form.category} onChange={set("category")}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {categoryLabel[c]}
                  </option>
                ))}
              </Select>
            </Field>
            <fieldset className="grid gap-2">
              <legend className="mb-2 text-sm font-medium">Dietary</legend>
              <div className="grid grid-cols-2 gap-2">
                {(["VEG", "NON_VEG"] as Dietary[]).map((d) => (
                  <label
                    key={d}
                    className={`flex cursor-pointer items-center justify-center rounded-[10px] border px-3 py-2.5 text-[15px] transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent ${
                      form.dietary === d ? "border-forest bg-forest text-on-forest" : "border-line bg-surface hover:border-ink/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name="dietary"
                      value={d}
                      checked={form.dietary === d}
                      onChange={() => setForm((f) => ({ ...f, dietary: d }))}
                      aria-label={d === "VEG" ? "Vegetarian" : "Non-vegetarian"}
                      className="sr-only"
                    />
                    {d === "VEG" ? "Vegetarian" : "Non-veg"}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="servings" label="Servings" hint="Roughly how many people it feeds." error={fieldErrors.servings}>
              <TextInput
                id="servings"
                type="number"
                inputMode="numeric"
                min={1}
                max={10000}
                required
                value={form.servings}
                onChange={set("servings")}
                error={fieldErrors.servings}
              />
            </Field>
            <Field id="quantityDescription" label="Quantity" optional hint="For example: 3 large trays." error={fieldErrors.quantityDescription}>
              <TextInput id="quantityDescription" maxLength={120} value={form.quantityDescription} onChange={set("quantityDescription")} />
            </Field>
          </div>
          <Field id="description" label="Notes for the volunteer" optional hint="Packaging, storage, allergens, who to ask for." error={fieldErrors.description}>
            <textarea
              id="description"
              name="description"
              rows={3}
              maxLength={1000}
              value={form.description}
              onChange={set("description")}
              className={`${inputClass} resize-y`}
            />
          </Field>
        </section>

        <section className="grid gap-5 border-t border-line pt-8">
          <h2 className="text-lg font-semibold">Timing</h2>
          <Field id="expiryTime" label={`Safe to eat until (${APP_TIME_ZONE_LABEL})`} error={fieldErrors.expiryTime}>
            <TextInput id="expiryTime" type="datetime-local" required value={form.expiryTime} onChange={set("expiryTime")} error={fieldErrors.expiryTime} />
          </Field>
          <div className="-mt-2 flex flex-wrap gap-2">
            {EXPIRY_PRESETS.map((p) => (
              <button
                key={p.minutes}
                type="button"
                onClick={() => setForm((f) => ({ ...f, expiryTime: inMinutes(p.minutes), pickupDeadline: inMinutes(Math.round(p.minutes * 0.6)) }))}
                className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm transition hover:border-forest active:scale-[0.98]"
              >
                In {p.label}
              </button>
            ))}
          </div>
          <Field id="pickupDeadline" label={`Collect by (${APP_TIME_ZONE_LABEL})`} hint="Must be on or before the time above." error={fieldErrors.pickupDeadline}>
            <TextInput
              id="pickupDeadline"
              type="datetime-local"
              required
              value={form.pickupDeadline}
              onChange={set("pickupDeadline")}
              error={fieldErrors.pickupDeadline}
            />
          </Field>
        </section>
      </div>

      <div className="grid content-start gap-5 lg:col-span-6">
        <h2 className="text-lg font-semibold">Pickup spot</h2>
        <Field id="pickupAddress" label="Address or landmark" error={fieldErrors.pickupAddress}>
          <TextInput
            id="pickupAddress"
            required
            maxLength={255}
            autoComplete="street-address"
            value={form.pickupAddress}
            onChange={set("pickupAddress")}
            error={fieldErrors.pickupAddress}
          />
        </Field>
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">Drag the pin or click the map to mark the exact spot.</p>
            <button type="button" onClick={locateMe} disabled={locating} className={`${secondaryButton} px-4 py-2 text-sm`}>
              <CrosshairIcon size={16} aria-hidden />
              {locating ? "Finding you..." : "Use my location"}
            </button>
          </div>
          <div className="relative z-0 aspect-[4/3] overflow-hidden rounded-2xl border border-line lg:aspect-square">
            <LocationPickerMap value={pin} onChange={onPinChange} />
          </div>
          <p className="font-mono text-xs text-muted">
            {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}
          </p>
        </div>
        <button type="submit" disabled={pending} className={`${primaryButton} mt-2 w-full`}>
          {pending ? "Posting..." : "Post donation"}
          {!pending && <ArrowRightIcon size={18} aria-hidden />}
        </button>
        <p className="text-center text-sm text-muted">Nearby volunteers and NGOs are matched as soon as you post.</p>
      </div>
    </form>
  );
}
