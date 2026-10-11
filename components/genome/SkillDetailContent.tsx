"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import BottomTab from "@/components/layout/BottomTab";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import skillData from "@/lib/data/skills.json";
import {
  greedyPath,
  ROLE_WEIGHTS,
  TARGET_MASTERY,
  type SkillName,
} from "@/lib/genome-core";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { SkillChip } from "@/components/ui/SkillChip";
import { useGenomeStore } from "@/store/genome";

interface SkillDetailContentProps {
  skill: SkillName;
}

type PageStatus = "loading" | "ready" | "error";

/** Menampilkan mastery, faktor, riwayat, dan sumber belajar satu skill. */
export function SkillDetailContent({ skill }: SkillDetailContentProps) {
  const [pageStatus, setPageStatus] = useState<PageStatus>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const mastery = useGenomeStore((state) => state.mastery);
  const history = useGenomeStore((state) => state.history);
  const hydrateGenome = useCallback(
    () => useGenomeStore.persist.rehydrate(),
    [],
  );
  const skillDetails = skillData.find((entry) => entry.name === skill);

  useEffect(() => {
    let isMounted = true;
    Promise.resolve()
      .then(() => hydrateGenome())
      .then(() => {
        if (isMounted) {
          setPageStatus("ready");
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoadError("Data genome tidak dapat dimuat dari penyimpanan lokal.");
          setPageStatus("error");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [hydrateGenome]);

  const skillHistory = useMemo(
    () =>
      history
        .filter((entry) => Number.isFinite(Date.parse(entry.at)))
        .slice()
        .sort((left, right) => Date.parse(left.at) - Date.parse(right.at))
        .map((entry) => ({
          at: entry.at,
          date: new Intl.DateTimeFormat("id-ID", {
            day: "numeric",
            month: "short",
            year: "2-digit",
          }).format(new Date(entry.at)),
          mastery: Math.round(entry.mastery[skill] * 100),
        })),
    [history, skill],
  );

  if (pageStatus === "loading") {
    return (
      <main className="mx-auto min-h-screen max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        <div className="h-10 w-64 animate-pulse rounded bg-glass" />
        <div className="h-64 animate-pulse rounded-lg bg-glass" />
        <p className="sr-only" role="status">
          Memuat detail skill…
        </p>
      </main>
    );
  }

  if (pageStatus === "error") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-pink" role="alert">
          {loadError}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-md bg-primary-strong px-4 py-2 font-medium text-white"
        >
          Muat ulang
        </button>
      </main>
    );
  }

  if (!mastery || !skillDetails) {
    return (
      <>
        <Navbar />
        <main className="mx-auto flex min-h-[65vh] max-w-4xl flex-col items-center justify-center px-6 py-16 text-center">
          <h1 className="font-heading text-3xl font-semibold text-text">
            Hasil asesmen belum tersedia
          </h1>
          <p className="mt-3 max-w-xl text-muted">
            Selesaikan asesmen untuk melihat penguasaan {skill} dan rekomendasi
            belajar yang sesuai.
          </p>
          <Link
            href="/onboarding"
            className="mt-6 rounded-md bg-primary-strong px-5 py-3 font-semibold text-white"
          >
            Ikuti asesmen
          </Link>
        </main>
        <Footer />
        <BottomTab />
      </>
    );
  }

  const skillMastery = Math.max(0, Math.min(1, mastery[skill]));
  const gap = Math.max(TARGET_MASTERY - skillMastery, 0);
  const importance = ROLE_WEIGHTS.data_analyst[skill];
  const priorityPath = greedyPath(mastery, "data_analyst", 8);
  const priorityIndex = priorityPath.findIndex((step) => step.skill === skill);
  const priorityStep = priorityIndex >= 0 ? priorityPath[priorityIndex] : null;
  const resources = skillDetails.resources;
  const singleHistoryEntry = skillHistory.length === 1;

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-7 sm:px-6 lg:pb-16 lg:pt-10">
        <Link
          href="/genome"
          className="mb-7 inline-flex items-center gap-2 rounded-md text-sm text-muted transition-colors hover:text-text focus-visible:outline-2 focus-visible:outline-primary-soft"
        >
          <span aria-hidden="true">←</span>
          Kembali ke genome
        </Link>

        <header className="glass mb-8 rounded-lg p-6 sm:p-8">
          <SkillChip skill={skill} level={skillMastery} />
          <h1 className="mt-5 font-heading text-3xl font-semibold text-text sm:text-4xl">
            Detail {skill}
          </h1>
          <p className="mt-3 max-w-3xl leading-7 text-muted">
            {skillDetails.description}
          </p>
          <div className="mt-7 max-w-2xl">
            <ScoreBar
              value={skillMastery * 100}
              target={TARGET_MASTERY * 100}
              label={`Penguasaan ${skill}`}
            />
          </div>
        </header>

        <section className="mb-8">
          <h2 className="mb-4 font-heading text-2xl font-semibold text-text">
            Faktor skor
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <article className="glass rounded-lg p-5">
              <p className="text-sm text-muted">Importance Data Analyst</p>
              <p className="mt-2 font-mono text-3xl tabular-nums text-text">
                {importance.toFixed(2)}
              </p>
            </article>
            <article className="glass rounded-lg p-5">
              <p className="text-sm text-muted">Gap terhadap target 80%</p>
              <p className="mt-2 font-mono text-3xl tabular-nums text-text">
                {Math.round(gap * 100)}%
              </p>
            </article>
            <article className="glass rounded-lg p-5">
              <p className="text-sm text-muted">Prioritas roadmap</p>
              {priorityStep ? (
                <p className="mt-2 font-mono text-3xl tabular-nums text-text">
                  #{priorityIndex + 1}
                  <span className="ml-2 text-base text-muted">
                    · {priorityStep.share_pct.toFixed(1)}%
                  </span>
                </p>
              ) : (
                <p className="mt-2 text-sm leading-6 text-text">
                  Target tercapai; tidak masuk prioritas aktif.
                </p>
              )}
            </article>
          </div>
          <p className="mt-4 max-w-3xl leading-7 text-muted">
            Skor {skill} dihitung dari performa pada soal yang menguji skill
            ini. Bobot importance menunjukkan relevansinya untuk Data Analyst;
            gap dan share prioritas memperlihatkan ruang belajar yang tersisa.
          </p>
        </section>

        <section className="glass mb-8 rounded-lg p-5 sm:p-7">
          <h2 className="font-heading text-2xl font-semibold text-text">
            Riwayat penguasaan
          </h2>
          {singleHistoryEntry ? (
            <p className="mt-3 leading-7 text-muted">
              Ulangi asesmen untuk melihat perkembangan penguasaan {skill}.
            </p>
          ) : skillHistory.length > 1 ? (
            <>
              <p className="mt-2 text-sm text-muted">
                Perubahan mastery {skill} pada setiap snapshot asesmen.
              </p>
              <div
                className="mt-5 h-72 w-full"
                role="img"
                aria-label={`Riwayat mastery ${skill} dalam persen`}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={skillHistory}
                    margin={{ top: 12, right: 16, bottom: 4, left: 0 }}
                  >
                    <CartesianGrid
                      stroke="rgb(255 255 255 / 0.1)"
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#94A3B8", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tickFormatter={(value: number) => `${value}%`}
                      tick={{ fill: "#94A3B8", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <ReferenceLine
                      y={80}
                      stroke="#94A3B8"
                      strokeDasharray="5 5"
                      label={{
                        value: "Target 80%",
                        fill: "#94A3B8",
                        position: "insideTopRight",
                      }}
                    />
                    <Tooltip
                      formatter={(value) => [`${value}%`, "Mastery"]}
                      contentStyle={{
                        background: "#0A0A1A",
                        border: "1px solid rgb(255 255 255 / 0.08)",
                        borderRadius: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="mastery"
                      name="Mastery"
                      stroke="#22D3EE"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "#22D3EE" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <table className="sr-only">
                <caption>Riwayat mastery {skill} antarasesmen</caption>
                <thead>
                  <tr>
                    <th scope="col">Tanggal</th>
                    <th scope="col">Mastery</th>
                  </tr>
                </thead>
                <tbody>
                  {skillHistory.map((entry) => (
                    <tr key={entry.at}>
                      <th scope="row">{entry.date}</th>
                      <td>{entry.mastery}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <p className="mt-3 leading-7 text-muted">
              Belum ada riwayat asesmen untuk skill ini.
            </p>
          )}
        </section>

        <section>
          <h2 className="mb-4 font-heading text-2xl font-semibold text-text">
            Sumber belajar
          </h2>
          <ul className="grid gap-4 md:grid-cols-2">
            {resources.map((resource) => (
              <li key={resource.url}>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="glass flex h-full flex-col justify-between gap-4 rounded-lg p-5 transition-colors hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-primary-soft"
                >
                  <span>
                    <span className="block font-medium text-text">
                      {resource.title}
                    </span>
                    <span className="mt-2 block text-sm text-muted">
                      Estimasi {resource.hours} jam belajar
                    </span>
                  </span>
                  <span className="text-sm text-cyan">Buka sumber belajar ↗</span>
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted">
            Sumber belajar dapat dibuka gratis; sebagian penyedia mungkin
            menawarkan fitur berbayar.
          </p>
        </section>
      </main>
      <Footer />
      <BottomTab />
    </>
  );
}
