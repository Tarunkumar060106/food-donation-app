import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, MapPinIcon, BicycleIcon } from "@phosphor-icons/react/ssr";
import { photos } from "@/lib/photos";
import { Countdown } from "./Countdown";
import { Reveal } from "./Reveal";

function DonationCard() {
  return (
    <div className="w-full max-w-[320px] rounded-2xl border border-line bg-surface p-5 shadow-[0_24px_60px_-20px_rgb(var(--shadow)/0.35)]">
      <div className="flex items-center justify-between text-xs text-muted">
        <span>Example donation</span>
        <span className="flex items-center gap-1">
          <MapPinIcon size={14} aria-hidden />
          1.2 km away
        </span>
      </div>
      <p className="mt-3 text-lg font-medium leading-snug">80 vegetarian meals</p>
      <p className="text-sm text-muted">Hostel mess, pickup by 8:30 pm</p>
      <div className="mt-4 flex items-end justify-between border-t border-line pt-4">
        <div>
          <p className="text-xs text-muted">Time until expiry</p>
          <p className="text-2xl text-accent">
            <Countdown startSeconds={42 * 60 + 18} />
          </p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-sage px-3 py-1 text-xs font-medium text-ink">
          <BicycleIcon size={14} aria-hidden />
          Volunteer on the way
        </span>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 pt-12 pb-20 sm:px-6 md:pt-16 lg:grid-cols-12 lg:gap-8 lg:px-8 lg:pt-20 lg:pb-28">
      <Reveal className="lg:col-span-6">
        <h1 className="text-5xl font-semibold leading-[1.02] tracking-tighter text-balance md:text-6xl lg:text-7xl">
          Surplus food, rescued in minutes.
        </h1>
        <p className="mt-6 max-w-[34ch] text-lg leading-relaxed text-muted md:text-xl">
          Donors post what&apos;s left. Nearby volunteers and NGOs get matched, pick it up, and
          deliver it before it expires.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Link
            href="/signup"
            className="group inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-medium text-on-accent transition hover:bg-accent-hover active:scale-[0.98]"
          >
            Get started
            <ArrowRightIcon size={18} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
          <a
            href="#how"
            className="inline-flex items-center rounded-full border border-line px-6 py-3 font-medium text-ink transition hover:border-ink/40 active:scale-[0.98]"
          >
            See how it works
          </a>
        </div>
      </Reveal>

      <Reveal delay={0.15} className="relative lg:col-span-6">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl sm:aspect-[5/4] lg:aspect-auto lg:h-[min(600px,calc(100dvh-10rem))]">
          <Image
            src={photos.hero.src}
            alt={photos.hero.alt}
            fill
            preload
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="object-cover"
          />
        </div>
        <div className="mt-4 flex justify-center lg:absolute lg:-bottom-8 lg:-left-10 lg:mt-0 lg:block">
          <DonationCard />
        </div>
      </Reveal>
    </section>
  );
}
