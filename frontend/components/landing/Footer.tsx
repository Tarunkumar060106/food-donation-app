import { Logo } from "./Nav";

const links = [
  { href: "#how", label: "How it works" },
  { href: "#roles", label: "Who it's for" },
  { href: "#matching", label: "Matching" },
  { href: "#tracking", label: "Tracking" },
];

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div>
          <Logo />
          <p className="mt-3 max-w-[40ch] text-sm leading-relaxed text-muted">
            Coordinating surplus food between donors, volunteers and NGOs. Built for the
            Vision2Web Hackathon 2026.
          </p>
        </div>
        <div className="flex flex-col gap-4 md:items-end">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="transition-colors hover:text-ink">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted">Photography from Unsplash</p>
        </div>
      </div>
    </footer>
  );
}
