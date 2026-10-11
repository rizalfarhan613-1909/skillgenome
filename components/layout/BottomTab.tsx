"use client";

import { BriefcaseBusiness, Dna, IdCard, Map, TrendingUp } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/genome", label: "Genome", Icon: Dna },
  { href: "/roadmap", label: "Roadmap", Icon: Map },
  { href: "/jobs", label: "Jobs", Icon: BriefcaseBusiness },
  { href: "/passport", label: "Passport", Icon: IdCard },
  { href: "/progress", label: "Progress", Icon: TrendingUp },
] as const;

/** Menampilkan navigasi bawah yang responsif untuk viewport mobile. */
export default function BottomTab() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi utama"
      className="glass fixed inset-x-0 bottom-0 z-50 border-t border-glass-border pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="mx-auto grid h-16 max-w-lg grid-cols-5">
        {tabs.map(({ href, label, Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`flex h-full flex-col items-center justify-center gap-1 text-xs transition-colors ${
                  isActive ? "text-primary-soft" : "text-muted"
                }`}
              >
                <Icon aria-hidden="true" size={20} strokeWidth={1.5} />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
