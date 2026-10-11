"use client";

import { Copy, Crown, Trophy } from "lucide-react";
import { useState } from "react";
import BottomTab from "@/components/layout/BottomTab";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";

interface LeaderboardEntry {
  rank: number;
  alias: string;
  match_pct: number;
}

interface FeedEntry {
  id: string;
  alias: string;
  action: string;
  minutesAgo: number;
}

const LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, alias: "Anonim A7", match_pct: 82.4 },
  { rank: 2, alias: "Anonim K3", match_pct: 79.1 },
  { rank: 3, alias: "Anonim M9", match_pct: 76.8 },
  { rank: 4, alias: "Anonim R2", match_pct: 74.5 },
  { rank: 5, alias: "Anonim T5", match_pct: 71.2 },
  { rank: 6, alias: "Anonim B8", match_pct: 69.7 },
  { rank: 7, alias: "Anonim D1", match_pct: 66.3 },
  { rank: 8, alias: "Anonim F6", match_pct: 63.9 },
  { rank: 9, alias: "Anonim H4", match_pct: 61.5 },
  { rank: 10, alias: "Anonim J0", match_pct: 58.2 },
];

const FEED: FeedEntry[] = [
  { id: "f1", alias: "Anonim K3", action: "menyelesaikan asesmen", minutesAgo: 4 },
  { id: "f2", alias: "Anonim A7", action: "membuat Skill Passport", minutesAgo: 12 },
  { id: "f3", alias: "Anonim M9", action: "mencapai level Mahir pada SQL", minutesAgo: 27 },
  { id: "f4", alias: "Anonim R2", action: "menyelesaikan asesmen", minutesAgo: 43 },
  { id: "f5", alias: "Anonim T5", action: "menyelesaikan asesmen", minutesAgo: 68 },
];

/** Memformat waktu relatif sederhana dalam Bahasa Indonesia. */
function relativeTime(minutesAgo: number): string {
  if (minutesAgo < 1) return "baru saja";
  if (minutesAgo < 60) return `${minutesAgo} menit lalu`;
  const hours = Math.floor(minutesAgo / 60);
  return `${hours} jam lalu`;
}

const numberFormat = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** Halaman komunitas: leaderboard anonim dan feed pencapaian berlabel contoh data. */
export default function CommunityPage() {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Komunitas SkillGenome",
          text: "Lihat leaderboard dan feed pencapaian SkillGenome.",
          url: window.location.href,
        });
        return;
      }
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      // Pengguna membatalkan berbagi atau clipboard tidak tersedia.
    }
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-5xl px-4 pb-72 pt-7 sm:px-6 md:pb-12 md:pt-10 lg:pb-16">
        <header className="mb-6">
          <p className="mb-2 font-mono text-sm text-cyan">TIER 3 - PENDUKUNG</p>
          <h1 className="font-heading text-3xl font-semibold text-text sm:text-4xl">
            Komunitas
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Leaderboard anonim dan feed pencapaian. Bergabung hanya dengan izin
            eksplisit dan tidak pernah menampilkan email atau nama asli.
          </p>
        </header>

        <p
          role="note"
          className="glass mb-6 rounded-lg px-4 py-3 text-center text-sm font-medium text-primary-soft"
        >
          Contoh data, bukan data nyata
        </p>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <section aria-label="Leaderboard" className="glass rounded-lg p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-text">
              <Trophy aria-hidden="true" size={18} strokeWidth={1.5} className="text-cyan" />
              Leaderboard
            </h2>
            <ol className="mt-4 space-y-2">
              {LEADERBOARD.map((entry) => (
                <li
                  key={entry.rank}
                  className="flex items-center gap-3 rounded-md border border-glass-border px-3 py-2.5"
                >
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full font-mono text-sm font-semibold tabular-nums ${
                      entry.rank === 1
                        ? "bg-primary/15 text-primary-soft"
                        : "bg-glass text-muted"
                    }`}
                  >
                    {entry.rank}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-text">
                    {entry.alias}
                  </span>
                  {entry.rank === 1 && (
                    <Crown
                      aria-hidden="true"
                      size={16}
                      strokeWidth={1.5}
                      className="shrink-0 text-primary-soft"
                    />
                  )}
                  <span className="font-mono text-sm tabular-nums text-primary-soft">
                    {numberFormat.format(entry.match_pct)}%
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <section aria-label="Feed pencapaian" className="glass rounded-lg p-5 sm:p-6">
            <h2 className="font-heading text-lg font-semibold text-text">
              Feed pencapaian
            </h2>
            <ul className="mt-4 space-y-4">
              {FEED.map((entry) => (
                <li key={entry.id} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-1.5 size-2 shrink-0 rounded-full bg-cyan"
                  />
                  <div>
                    <p className="text-sm leading-6 text-text">
                      <span className="font-medium">{entry.alias}</span>{" "}
                      {entry.action}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-muted">
                      {relativeTime(entry.minutesAgo)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={handleShare}
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-glass-border px-4 text-sm font-medium text-text transition-colors hover:bg-glass"
            >
              <Copy aria-hidden="true" size={16} strokeWidth={1.5} />
              Bagikan tautan
            </button>
            {copied && (
              <p className="mt-2 text-xs text-muted" role="status">
                Tautan disalin ke clipboard.
              </p>
            )}
          </section>
        </div>
      </main>

      <Footer />
      <BottomTab />
    </>
  );
}
