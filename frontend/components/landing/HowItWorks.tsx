"use client";

import { motion, useReducedMotion } from "motion/react";
import {
  NotePencilIcon,
  TargetIcon,
  BicycleIcon,
  HandHeartIcon,
  ChartLineUpIcon,
} from "@phosphor-icons/react";

const stages = [
  {
    icon: NotePencilIcon,
    title: "Post",
    body: "A donor lists the food, quantity, pickup window and expiry time in under a minute.",
  },
  {
    icon: TargetIcon,
    title: "Match",
    body: "Nearby volunteers and NGOs are ranked by urgency, distance and capacity.",
  },
  {
    icon: BicycleIcon,
    title: "Pick up",
    body: "A volunteer claims it, shares their location for the trip, and heads over.",
  },
  {
    icon: HandHeartIcon,
    title: "Deliver",
    body: "The food reaches people who need it, with a timestamp at every step.",
  },
  {
    icon: ChartLineUpIcon,
    title: "Measure",
    body: "Each delivery adds to the servings rescued on the impact dashboard.",
  },
];

const ease = [0.16, 1, 0.3, 1] as const;

export function HowItWorks() {
  const reduce = useReducedMotion();

  return (
    <section id="how" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 md:py-32 lg:px-8">
      <div className="max-w-2xl">
        <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">
          One loop, from surplus to served.
        </h2>
        <p className="mt-5 max-w-[60ch] text-lg leading-relaxed text-muted">
          Every donation follows the same five moves, so nobody has to guess what happens next.
        </p>
      </div>

      <ol className="relative mt-16 grid gap-10 md:grid-cols-5 md:gap-6">
        <motion.span
          aria-hidden
          className="absolute top-6 left-6 hidden h-px w-[calc(80%+1.2rem)] origin-left bg-accent/50 md:block"
          initial={reduce ? false : { scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 1.4, ease }}
        />
        <span
          aria-hidden
          className="absolute top-6 bottom-6 left-6 w-px bg-line md:hidden"
        />
        {stages.map((s, i) => (
          <motion.li
            key={s.title}
            className="relative flex gap-5 md:block"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.6, delay: 0.2 + i * 0.18, ease }}
          >
            <span className="relative z-10 flex size-12 shrink-0 items-center justify-center rounded-full border border-line bg-bg text-accent">
              <s.icon size={22} weight="duotone" aria-hidden />
            </span>
            <div className="md:mt-6">
              <h3 className="text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 leading-relaxed text-muted">{s.body}</p>
            </div>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
