import Link from "next/link";

/** Menampilkan kredit proyek dan tautan kebijakan untuk pengguna. */
export default function Footer() {
  return (
    <footer className="border-t border-glass-border px-6 py-8 text-sm text-muted">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p>SkillGenome · Built with IBM Bob + Langflow for Hacktiv8 x IBM 2026</p>
        <nav aria-label="Kebijakan" className="flex gap-5">
          <Link href="/settings" className="hover:text-text focus-visible:text-text">
            Privacy
          </Link>
          <Link
            href="/settings"
            className="hover:text-text focus-visible:text-text"
          >
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  );
}
