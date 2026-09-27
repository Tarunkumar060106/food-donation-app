"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, CrosshairIcon, SnowflakeIcon } from "@phosphor-icons/react";
import { ApiError, api } from "@/lib/api";
import { categoryLabel } from "@/lib/format";
import { APP_TIME_ZONE_LABEL, fromIstInput, istInputInMinutes, istInputNow, toIstInput } from "@/lib/time";
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

// Placeholder food-safety defaults for the team to confirm; the donor can always change the times.
const SAFE_HOURS = { roomTemperature: 4, refrigerated: 24 };
const COLLECT_BUFFER_HOURS = { roomTemperature: 1, refrigerated: 4 };
const HOUR_MS = 3_600_000;
const MIN_LEAD_MS = 30 * 60_000;
const CLOCK_SLACK_MS = 5 * 60_000;

type Suggestion = { tooOld: true } | { tooOld: false; expiryTime: string; pickupDeadline: string };

/** Expiry and collect-by times suggested from when the food was cooked and how it is kept. */
function suggestTimes(preparedInput: string, cold: boolean): Suggestion | null {
  if (!preparedInput) return null;
  const prepared = fromIstInput(preparedInput).getTime();
  if (Number.isNaN(prepared)) return null;
  const expiry = prepared + (cold ? SAFE_HOURS.refrigerated : SAFE_HOURS.roomTemperature) * HOUR_MS;
  const earliestDeadline = Date.now() + MIN_LEAD_MS;
  if (expiry <= earliestDeadline) return { tooOld: true };
  const buffer = (cold ? COLLECT_BUFFER_HOURS.refrigerated : COLLECT_BUFFER_HOURS.roomTemperature) * HOUR_MS;
  const deadline = Math.min(Math.max(expiry - buffer, earliestDeadline), expiry);
  return { tooOld: false, expiryTime: toIstInput(new Date(expiry)), pickupDeadline: toIstInput(new Date(deadline)) };
}

function initialTimes() {
  const preparedAt = istInputNow();
  const suggestion = suggestTimes(preparedAt, false);
  return suggestion && !suggestion.tooOld
    ? { preparedAt, expiryTime: suggestion.expiryTime, pickupDeadline: suggestion.pickupDeadline }
    : { preparedAt, expiryTime: inMinutes(120), pickupDeadline: inMinutes(60) };
}

function safeHours(cold: boolean) {
  return cold ? SAFE_HOURS.refrigerated : SAFE_HOURS.roomTemperature;
}

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
    requiresRefrigeration: false,
    // Uses the viewer's clock; safe because this form only renders in the browser.
    ...initialTimes(),
  });
  // Times follow the cooking time until the donor sets them by hand.
  const [autoTimes, setAutoTimes] = useState(true);
  const suggestion = suggestTimes(form.preparedAt, form.requiresRefrigeration);
  const [pin, setPin] = useState<LatLng>(defaultLocation);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));
  const onPinChange = useCallback((p: LatLng) => setPin(p), []);

  function updateFoodSafety(patch: { preparedAt?: string; requiresRefrigeration?: boolean }, forceSuggest = false) {
    setForm((f) => {
      const next = { ...f, ...patch };
      const s = suggestTimes(next.preparedAt, next.requiresRefrigeration);
      return (autoTimes || forceSuggest) && s && !s.tooOld
        ? { ...next, expiryTime: s.expiryTime, pickupDeadline: s.pickupDeadline }
        : next;
    });
    if (forceSuggest) setAutoTimes(true);
  }

  const setTime = (key: "expiryTime" | "pickupDeadline") => (e: React.ChangeEvent<HTMLInputElement>) => {
    setAutoTimes(false);
    setForm((f) => ({ ...f, [key]: e.target.value }));
  };

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
    if (form.preparedAt) {
      const prepared = fromIstInput(form.preparedAt);
      if (Number.isNaN(prepared.getTime())) errs.preparedAt = "Enter a valid time.";
      else if (prepared.getTime() > Date.now() + CLOCK_SLACK_MS) errs.preparedAt = "The cooking time can't be in the future.";
      else if (!Number.isNaN(expiry.getTime()) && prepared >= expiry) errs.preparedAt = "It must be cooked before it expires.";
    }
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
          preparedAt: form.preparedAt ? fromIstInput(form.preparedAt).toISOString() : null,
          requiresRefrigeration: form.requiresRefrigeration,
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
          <h2 className="text-lg font-semibold">Timing and storage</h2>
          <Field
            id="preparedAt"
            label={`Cooked or prepared at (${APP_TIME_ZONE_LABEL})`}
            optional
            hint={
              suggestion?.tooOld
                ? `That was over ${safeHours(form.requiresRefrigeration)} hours ago. Please check it is still safe before posting.`
                : "Leave empty for packaged food or fresh produce."
            }
            error={fieldErrors.preparedAt}
          >
            <TextInput
              id="preparedAt"
              type="datetime-local"
              value={form.preparedAt}
              onChange={(e) => updateFoodSafety({ preparedAt: e.target.value })}
              error={fieldErrors.preparedAt}
            />
          </Field>
          <label
            className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent ${
              form.requiresRefrigeration ? "border-forest bg-forest/5" : "border-line bg-surface hover:border-ink/30"
            }`}
          >
            <input
              type="checkbox"
              checked={form.requiresRefrigeration}
              onChange={(e) => updateFoodSafety({ requiresRefrigeration: e.target.checked })}
              className="mt-1 size-4 accent-[var(--forest)]"
            />
            <span>
              <span className="flex items-center gap-2 font-medium">
                <SnowflakeIcon size={16} weight="bold" className="text-forest dark:text-[#8fbf9f]" aria-hidden />
                Keep refrigerated
              </span>
              <span className="mt-0.5 block text-sm text-muted">
                Dairy, meat, cut fruit, or anything that spoils outside a fridge. Collectors with a cool box are preferred.
              </span>
            </span>
          </label>
          <Field
            id="expiryTime"
            label={`Safe to eat until (${APP_TIME_ZONE_LABEL})`}
            hint={
              autoTimes && suggestion && !suggestion.tooOld
                ? `Suggested: ${safeHours(form.requiresRefrigeration)} hours after cooking${form.requiresRefrigeration ? ", kept in a fridge" : " at room temperature"}. Change it if you know better.`
                : undefined
            }
            error={fieldErrors.expiryTime}
          >
            <TextInput id="expiryTime" type="datetime-local" required value={form.expiryTime} onChange={setTime("expiryTime")} error={fieldErrors.expiryTime} />
          </Field>
          <div className="-mt-2 flex flex-wrap gap-2">
            {EXPIRY_PRESETS.map((p) => (
              <button
                key={p.minutes}
                type="button"
                onClick={() => {
                  setAutoTimes(false);
                  setForm((f) => ({ ...f, expiryTime: inMinutes(p.minutes), pickupDeadline: inMinutes(Math.round(p.minutes * 0.6)) }));
                }}
                className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm transition hover:border-forest active:scale-[0.98]"
              >
                In {p.label}
              </button>
            ))}
            {!autoTimes && suggestion && !suggestion.tooOld && (
              <button
                type="button"
                onClick={() => updateFoodSafety({}, true)}
                className="px-2 py-1.5 text-sm text-muted underline decoration-line underline-offset-4 hover:text-ink"
              >
                Use suggested times
              </button>
            )}
          </div>
          <Field id="pickupDeadline" label={`Collect by (${APP_TIME_ZONE_LABEL})`} hint="Must be on or before the time above." error={fieldErrors.pickupDeadline}>
            <TextInput
              id="pickupDeadline"
              type="datetime-local"
              required
              value={form.pickupDeadline}
              onChange={setTime("pickupDeadline")}
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
