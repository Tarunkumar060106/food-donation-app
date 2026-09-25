import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/ssr";
import { photos } from "@/lib/photos";
import { Reveal } from "./Reveal";

export function Closing() {
  return (
    <section className="px-4 py-24 sm:px-6 md:py-32 lg:px-8">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl">
        <Image
          src={photos.closing.src}
          alt={photos.closing.alt}
          fill
          sizes="(min-width: 1280px) 1280px, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[#0e1813]/65" />
        <Reveal className="relative px-6 py-20 text-[#e9f0ea] sm:px-12 md:py-28 lg:px-16">
          <h2 className="max-w-[18ch] text-4xl font-semibold leading-[1.08] tracking-tight md:text-6xl">
            Have food to share, or an hour to help?
          </h2>
          <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-[#e9f0ea]/80">
            Join as a donor, volunteer or NGO. It takes a minute to set up, and the next pickup
            might be around the corner.
          </p>
          <Link
            href="/signup"
            className="group mt-10 inline-flex items-center gap-2 rounded-full bg-[#f0703f] px-6 py-3 font-medium text-[#0e1813] transition hover:bg-[#f58a5e] active:scale-[0.98]"
          >
            Get started
            <ArrowRightIcon size={18} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
