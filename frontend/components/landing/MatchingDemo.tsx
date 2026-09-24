"use client";

import { useId, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

const MIN_MINUTES = 15;
const MAX_MINUTES = 240;
const MIN_KM = 0.5;
const MAX_KM = 10;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

function score(minutes: number, km: number) {
  const urgency = clamp01(1 - (minutes - MIN_MINUTES) / (MAX_MINUTES - MIN_MINUTES));
  const distance = clamp01(1 - (km - MIN_KM) / (MAX_KM - MIN_KM));
  return [
    { key: "urgency", label: "Expiry urgency", weight: 40, points: 40 * urgency, tone: "bg-accent" },
    { key: "distance", label: "Distance", weight: 30, points: 30 * distance, tone: "bg-[#8fbf9f]" },
    { key: "capacity", label: "Capacity fit", weight: 20, points: 20, tone: "bg-on-forest/60" },
    { key: "food", label: "Food compatibility", weight: 10, points: 10, tone: "bg-on-forest/30" },
  ];
}

function formatMinutes(m: number) {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
}

const sliderClass =
  "mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-line accent-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent";

export function MatchingDemo() {
  const [minutes, setMinutes] = useState(42);
  const [km, setKm] = useState(1.2);
  const reduce = useReducedMotion();
  const timeId = useId();
  const kmId = useId();

  const parts = score(minutes, km);
  const total = Math.round(parts.reduce((sum, p) => sum + p.points, 0));

  return (
    <section id="matching" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 md:py-32 lg:px-8">
      <div className="max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
          Transparent matching
        </p>
        <h2 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
          A match score you can read.
        </h2>
        <p className="mt-5 max-w-[60ch] text-lg leading-relaxed text-muted">
          Four signals, fixed weights, and a plain reason behind every recommendation. Move the
          sliders to see how urgency changes the result.
        </p>
      </div>

      <div className="mt-14 grid gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="space-y-10 rounded-2xl border border-line bg-surface p-6 sm:p-8 lg:col-span-5">
          <div>
            <div className="flex items-baseline justify-between gap-4">
              <label htmlFor={timeId} className="font-medium">
                Time until expiry
              </label>
              <span className="font-mono text-sm text-muted">{formatMinutes(minutes)}</span>
            </div>
            <input
              id={timeId}
              type="range"
              min={MIN_MINUTES}
              max={MAX_MINUTES}
              step={1}
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              className={sliderClass}
            />
          </div>
          <div>
            <div className="flex items-baseline justify-between gap-4">
              <label htmlFor={kmId} className="font-medium">
                Distance to collector
              </label>
              <span className="font-mono text-sm text-muted">{km.toFixed(1)} km</span>
            </div>
            <input
              id={kmId}
              type="range"
              min={MIN_KM}
              max={MAX_KM}
              step={0.1}
              value={km}
              onChange={(e) => setKm(Number(e.target.value))}
              className={sliderClass}
            />
          </div>
          <p className="text-sm leading-relaxed text-muted">
            In this example the collector has room for the full donation and accepts vegetarian
            food, so capacity and compatibility score in full.
          </p>
        </div>

        <div className="flex flex-col justify-between rounded-2xl bg-forest p-6 text-on-forest sm:p-8 lg:col-span-7">
          <div>
            <p className="text-sm text-on-forest/70">Recommended volunteer</p>
            <p className="mt-2 font-mono text-7xl font-medium tracking-tight tabular-nums md:text-8xl" aria-live="polite">
              {total}%
            </p>
            <p className="mt-3 font-mono text-sm text-on-forest/80">
              {km.toFixed(1)} km away, capacity available, expires in {formatMinutes(minutes)}
            </p>
          </div>

          <div className="mt-10">
            <div className="flex h-3 w-full gap-1" aria-hidden>
              {parts.map((p) => (
                <motion.span
                  key={p.key}
                  className={`h-full rounded-full ${p.tone}`}
                  animate={{ width: `${p.points}%` }}
                  transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 20 }}
                />
              ))}
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
              {parts.map((p) => (
                <div key={p.key}>
                  <dt className="flex items-center gap-2 text-sm text-on-forest/70">
                    <span className={`size-2.5 rounded-full ${p.tone}`} aria-hidden />
                    {p.label}
                  </dt>
                  <dd className="mt-1 font-mono text-lg tabular-nums">
                    {Math.round(p.points)}
                    <span className="text-on-forest/60"> / {p.weight}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
