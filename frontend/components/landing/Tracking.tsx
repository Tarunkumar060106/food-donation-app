import Image from "next/image";
import { ShieldCheckIcon, WifiSlashIcon } from "@phosphor-icons/react/ssr";
import { photos } from "@/lib/photos";
import { Reveal } from "./Reveal";

const timeline = [
  { label: "Claimed", time: "6:02 pm", done: true },
  { label: "Arrived", time: "6:11 pm", done: true },
  { label: "Picked up", time: "6:14 pm", done: true },
  { label: "In transit", time: "6:15 pm", done: true },
  { label: "Delivered", time: "Pending", done: false },
];

export function Tracking() {
  return (
    <section id="tracking" className="bg-surface py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="max-w-2xl text-4xl font-semibold tracking-tight md:text-5xl">
          Follow every pickup as it happens.
        </h2>

        <div className="mt-14 grid gap-4 md:grid-cols-3 md:grid-rows-[auto_auto]">
          <Reveal className="relative min-h-[340px] overflow-hidden rounded-2xl md:col-span-2 md:row-span-2 md:min-h-[460px]">
            <Image
              src={photos.tracking.src}
              alt={photos.tracking.alt}
              fill
              sizes="(min-width: 768px) 66vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e1813]/85 via-[#0e1813]/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-[#e9f0ea] sm:p-8">
              <h3 className="text-2xl font-semibold tracking-tight">Live location, only during the trip</h3>
              <p className="mt-2 max-w-[48ch] leading-relaxed text-[#e9f0ea]/80">
                Donors and admins see the volunteer move on the map from pickup to drop-off.
                Nobody else does.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="rounded-2xl bg-forest p-6 text-on-forest sm:p-8">
            <ShieldCheckIcon size={28} weight="duotone" aria-hidden />
            <h3 className="mt-5 text-xl font-semibold">Consent first</h3>
            <p className="mt-2 leading-relaxed text-on-forest/75">
              Sharing starts when the volunteer taps Start trip and stops the moment the food is
              delivered.
            </p>
          </Reveal>

          <Reveal delay={0.2} className="rounded-2xl bg-sage p-6 sm:p-8">
            <WifiSlashIcon size={28} weight="duotone" className="text-accent" aria-hidden />
            <h3 className="mt-5 text-xl font-semibold">Works when GPS doesn&apos;t</h3>
            <p className="mt-2 leading-relaxed text-muted">
              If location drops, the map keeps the last known position and status updates carry
              on.
            </p>
          </Reveal>

          <Reveal className="rounded-2xl border border-line bg-bg p-6 sm:p-8 md:col-span-3">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-baseline">
              <h3 className="text-xl font-semibold">Every step, timestamped</h3>
              <p className="text-sm text-muted">Example pickup</p>
            </div>
            <ol className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-5 sm:gap-3">
              {timeline.map((t) => (
                <li key={t.label} className="flex items-center gap-3 sm:block">
                  <span
                    className={`block h-1.5 w-10 rounded-full sm:w-full ${t.done ? "bg-accent" : "bg-line"}`}
                    aria-hidden
                  />
                  <div className="sm:mt-4">
                    <p className="font-medium">{t.label}</p>
                    <p className="font-mono text-sm text-muted">{t.time}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
