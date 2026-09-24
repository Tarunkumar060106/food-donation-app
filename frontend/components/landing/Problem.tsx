import { Reveal } from "./Reveal";

export function Problem() {
  return (
    <section className="border-y border-line bg-surface">
      <Reveal className="mx-auto max-w-5xl px-4 py-24 text-center sm:px-6 md:py-32">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Why it matters</p>
        <p className="mt-8 text-3xl font-medium leading-[1.2] tracking-tight text-balance md:text-5xl">
          Households wasted <span className="text-accent">over 1 billion meals a day</span> in 2022,
          while 783 million people faced hunger.
        </p>
        <p className="mx-auto mt-8 max-w-[52ch] text-lg leading-relaxed text-muted">
          Surplus food is rarely the hard part. The hard part is finding someone nearby who can
          collect it before it spoils.
        </p>
        <p className="mt-10 text-sm text-muted">
          Source:{" "}
          <a
            href="https://www.unep.org/news-and-stories/press-release/world-squanders-over-1-billion-meals-day-un-report"
            className="underline decoration-line underline-offset-4 transition-colors hover:text-ink"
            target="_blank"
            rel="noreferrer"
          >
            UNEP Food Waste Index Report 2024
          </a>
        </p>
      </Reveal>
    </section>
  );
}
