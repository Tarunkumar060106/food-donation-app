"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  StorefrontIcon,
  BicycleIcon,
  BuildingsIcon,
  GaugeIcon,
  CheckIcon,
} from "@phosphor-icons/react";
import { photos } from "@/lib/photos";

const roles = [
  {
    id: "donor",
    label: "Donor",
    icon: StorefrontIcon,
    who: "Restaurants, hostels, households and event organisers",
    photo: photos.donor,
    points: [
      "List surplus food in under a minute: what it is, how much, and when it expires.",
      "Accept a collector's request or offer it to the best match, then see how far away they are.",
      "Follow the pickup live on a map until it is collected.",
      "Get a delivery confirmation and see how many servings you saved.",
    ],
  },
  {
    id: "volunteer",
    label: "Volunteer",
    icon: BicycleIcon,
    who: "Students, neighbours, anyone with an hour and a way to get around",
    photo: photos.volunteer,
    points: [
      "Browse nearby donations, sorted by how soon they expire.",
      "See why a pickup suits you: distance, time left and match score.",
      "Ask for it or accept an offer, then share your location only while the trip is active.",
      "Update status in one tap: arrived, picked up, in transit, delivered.",
    ],
  },
  {
    id: "ngo",
    label: "NGO",
    icon: BuildingsIcon,
    who: "Shelters, community kitchens and food banks",
    photo: photos.ngo,
    points: [
      "Set your capacity and the kinds of food you can accept.",
      "Receive recommendations that fit what you can actually handle.",
      "Accept eligible donations and coordinate collection with volunteers.",
      "Keep a record of everything your organisation has received.",
    ],
  },
  {
    id: "admin",
    label: "Admin",
    icon: GaugeIcon,
    who: "Platform operators and coordinators",
    photo: photos.admin,
    points: [
      "Watch every active donation and pickup from one operations view.",
      "Step in when a pickup stalls or a donation is close to expiring.",
      "Manage users, organisations and roles.",
      "Track servings rescued, completed deliveries and expired donations.",
    ],
  },
];

export function Roles() {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const reduce = useReducedMotion();
  const role = roles[active];

  const onKeyDown = (e: React.KeyboardEvent) => {
    const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (active + delta + roles.length) % roles.length;
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <section id="roles" className="bg-surface py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="max-w-2xl text-4xl font-semibold tracking-tight md:text-5xl">
          Built for everyone in the handoff.
        </h2>

        <div
          role="tablist"
          aria-label="User roles"
          onKeyDown={onKeyDown}
          className="mt-10 flex gap-2 overflow-x-auto pb-1"
        >
          {roles.map((r, i) => {
            const selected = i === active;
            return (
              <button
                key={r.id}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                role="tab"
                id={`tab-${r.id}`}
                aria-selected={selected}
                aria-controls={`panel-${r.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(i)}
                className={`flex shrink-0 items-center gap-2 rounded-full border px-5 py-2.5 text-[15px] font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  selected
                    ? "border-forest bg-forest text-on-forest"
                    : "border-line text-muted hover:border-ink/30 hover:text-ink"
                }`}
              >
                <r.icon size={18} weight={selected ? "fill" : "regular"} aria-hidden />
                {r.label}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={role.id}
            role="tabpanel"
            id={`panel-${role.id}`}
            aria-labelledby={`tab-${role.id}`}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 grid items-center gap-10 md:grid-cols-12 md:gap-12"
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl md:col-span-5 md:aspect-[4/5]">
              <Image
                src={role.photo.src}
                alt={role.photo.alt}
                fill
                sizes="(min-width: 768px) 40vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="md:col-span-7">
              <p className="text-2xl font-medium tracking-tight md:text-3xl">{role.who}</p>
              <ul className="mt-8 grid gap-x-10 gap-y-6 sm:grid-cols-2">
                {role.points.map((p) => (
                  <li key={p} className="flex gap-3">
                    <span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-sage text-accent">
                      <CheckIcon size={12} weight="bold" aria-hidden />
                    </span>
                    <span className="leading-relaxed text-muted">{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
