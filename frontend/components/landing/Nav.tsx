import Link from "next/link";
import { BowlFoodIcon } from "@phosphor-icons/react/ssr";

const links = [
  { href: "#how", label: "How it works" },
  { href: "#roles", label: "Who it's for" },
  { href: "#matching", label: "Matching" },
  { href: "#tracking", label: "Tracking" },
];

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink">
      <BowlFoodIcon size={26} weight="duotone" className="text-accent" aria-hidden />
      FoodRescue
    </Link>
  );
}

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        <ul className="hidden items-center gap-8 text-[15px] text-muted md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="transition-colors hover:text-ink">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <Link
          href="/signin"
          className="rounded-full bg-accent px-5 py-2 text-[15px] font-medium text-on-accent transition hover:bg-accent-hover active:scale-[0.98]"
        >
          Get started
        </Link>
      </nav>
    </header>
  );
}
