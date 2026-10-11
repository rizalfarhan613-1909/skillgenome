"use client";

import Link from "next/link";
import { useState } from "react";

const navigationLinks = [
  { href: "/genome", label: "Genome" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/jobs", label: "Jobs" },
  { href: "/passport", label: "Passport" },
  { href: "/progress", label: "Progress" },
] as const;

const moreLinks = [
  { href: "/community", label: "Community" },
  { href: "/insights", label: "Insights" },
  { href: "/agent", label: "Agent" },
] as const;

/** Menampilkan navigasi utama SkillGenome pada viewport desktop. */
export default function Navbar() {
  const [moreOpen, setMoreOpen] = useState(false);

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
            <li className="relative">
              <button
                type="button"
                aria-expanded={moreOpen}
                aria-haspopup="true"
                onClick={() => setMoreOpen((open) => !open)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setMoreOpen(false);
                  }
                }}
                className="inline-flex min-h-11 items-center text-sm text-muted transition-colors hover:text-text focus-visible:text-text"
              >
                Lainnya
              </button>
              {moreOpen && (
                <ul
                  aria-label="Menu lainnya"
                  className="glass absolute right-0 top-full mt-1 min-w-44 rounded-lg border border-glass-border p-2"
                >
                  {moreLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setMoreOpen(false)}
                        className="flex min-h-11 items-center rounded-md px-3 text-sm text-muted transition-colors hover:bg-glass hover:text-text focus-visible:text-text"
                      >
                        {link.label}
                        {link.href === "/agent" && (
                          <span className="ml-2 rounded-full border border-glass-border px-2 py-0.5 font-mono text-[10px] text-primary-soft">
                            Dev
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
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
