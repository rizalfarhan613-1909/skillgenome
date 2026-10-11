import Link from "next/link";

const navigationLinks = [
  { href: "/genome", label: "Genome" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/jobs", label: "Jobs" },
  { href: "/passport", label: "Passport" },
  { href: "/progress", label: "Progress" },
] as const;

/** Menampilkan navigasi utama SkillGenome pada viewport desktop. */
export default function Navbar() {
  return (
    <header className="glass sticky top-0 z-40 hidden border-b border-glass-border lg:block">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link
          href="/"
          className="font-heading text-xl font-semibold text-primary-soft"
        >
          SkillGenome
        </Link>

        <nav aria-label="Navigasi utama">
          <ul className="flex items-center gap-7">
            {navigationLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-muted transition-colors hover:text-text focus-visible:text-text"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Link
          href="/onboarding"
          className="rounded-md bg-primary-strong px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-soft"
        >
          Mulai asesmen
        </Link>
      </div>
    </header>
  );
}
