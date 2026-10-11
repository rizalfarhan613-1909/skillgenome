"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import BottomTab from "@/components/layout/BottomTab";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { BobGuideDialog } from "@/components/agent/BobGuideDialog";
import { RadarGenome } from "@/components/genome/RadarGenome";
import { SkillList } from "@/components/genome/SkillList";
import { Metric } from "@/components/ui/Metric";
import { useGenomeStore } from "@/store/genome";
import { usePrefsStore } from "@/store/prefs";
import type { Mastery, SkillName } from "@/lib/genome-core";

const GalaxyView = dynamic(
  () =>
    import("@/components/genome/GenomeGalaxy").then(
      (module) => module.GenomeGalaxy,
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-full min-h-72 w-full animate-pulse rounded-lg bg-primary/10"
        role="status"
      >
        Memuat galaksi 3D.
      </div>
    ),
  },
);

type ViewMode = "radar" | "galaxy";
type PageStatus = "loading" | "ready" | "error";
const galaxyQuery = "(min-width: 640px)";

function subscribeToMediaQuery(query: string, callback: () => void) {
  const mediaQuery = window.matchMedia(query);
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

function getMediaQuerySnapshot(query: string) {
  return window.matchMedia(query).matches;
}

function getServerMediaQuerySnapshot() {
  return false;
}

interface MatchCountProps {
  value: number;
}

function MatchCount({ value }: MatchCountProps) {
  const reduceMotion = useReducedMotion();
  const progress = useMotionValue(0);
  const rounded = useTransform(progress, (latest) =>
    new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(latest),
  );

  useEffect(() => {
    const animation = animate(progress, value, {
      duration: reduceMotion ? 0 : 0.5,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => animation.stop();
  }, [progress, reduceMotion, value]);

  return <motion.span>{rounded}</motion.span>;
}

function formatAssessmentDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new RangeError("Tanggal asesmen tidak valid.");
  }
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/** Menampilkan dashboard genome beserta ringkasan, visual, dan prioritas skill. */
export default function GenomePage() {
  const [pageStatus, setPageStatus] = useState<PageStatus>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("radar");
  const [focusedSkill, setFocusedSkill] = useState<SkillName | null>(null);
  const [bobOpen, setBobOpen] = useState(false);
  const canShowGalaxy = useSyncExternalStore(
    (callback) => subscribeToMediaQuery(galaxyQuery, callback),
    () => getMediaQuerySnapshot(galaxyQuery),
    getServerMediaQuerySnapshot,
  );
  const mastery = useGenomeStore((state) => state.mastery);
  const theta = useGenomeStore((state) => state.theta);
  const result = useGenomeStore((state) => state.matchScore);
  const lastAssessedAt = useGenomeStore((state) => state.lastAssessedAt);
  const history = useGenomeStore((state) => state.history);
  const perceptionScore = usePrefsStore((state) => state.perceptionScore);
  const hydrateGenome = useCallback(
    () => useGenomeStore.persist.rehydrate(),
    [],
  );

  useEffect(() => {
    let isMounted = true;
    Promise.resolve()
      .then(() => usePrefsStore.persist.rehydrate())
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

  if (pageStatus === "loading") {
    return (
      <main className="mx-auto min-h-screen max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        <div className="h-10 w-64 animate-pulse rounded bg-glass" />
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="h-64 animate-pulse rounded-lg bg-glass" />
          <div className="h-96 animate-pulse rounded-lg bg-glass" />
        </div>
        <p className="sr-only" role="status">
          Memuat data genome…
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

  if (!mastery || theta === null || !result || !lastAssessedAt) {
    return (
      <>
        <Navbar />
        <main className="mx-auto flex min-h-[70vh] max-w-4xl flex-col items-center justify-center px-6 py-16 text-center">
          <p className="mb-3 font-mono text-sm text-cyan">GENOME KOSONG</p>
          <h1 className="font-heading text-3xl font-semibold text-text sm:text-4xl">
            Ikuti asesmen untuk melihat genome-mu
          </h1>
          <p className="mt-4 max-w-xl leading-7 text-muted">
            Jawab sepuluh soal untuk mendapatkan estimasi penguasaan skill,
            kecocokan target role, dan prioritas belajar berikutnya.
          </p>
          <Link
            href="/onboarding"
            className="mt-7 inline-flex min-h-12 items-center rounded-md bg-primary-strong px-6 font-semibold text-white transition-colors hover:bg-primary"
          >
            Ikuti asesmen
          </Link>
        </main>
        <Footer />
        <BottomTab />
      </>
    );
  }

  let assessedDate: string;
  try {
    assessedDate = formatAssessmentDate(lastAssessedAt);
  } catch (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-pink" role="alert">
          {error instanceof Error
            ? error.message
            : "Tanggal asesmen tidak valid."}
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

  const safeMastery = mastery satisfies Mastery;
  const activeViewMode = canShowGalaxy ? viewMode : "radar";

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-4 pb-40 pt-7 sm:px-6 lg:pb-28 lg:pt-10">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 font-mono text-sm text-cyan">
              SNAPSHOT ASESMEN
            </p>
            <h1 className="font-heading text-3xl font-semibold text-text sm:text-4xl">
              Genome per {assessedDate}
            </h1>
          </div>
          <p className="text-sm text-muted">
            Data Analyst · {history.length} asesmen tercatat
          </p>
        </header>

        <section className="grid gap-5 lg:grid-cols-[minmax(250px,0.75fr)_minmax(0,1.8fr)]">
          <div className="grid content-start gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <article className="glass glow-primary rounded-lg p-5">
              <p className="text-sm text-muted">Match Data Analyst</p>
              <p className="mt-2 font-mono text-4xl font-semibold tabular-nums text-primary-soft">
                <MatchCount value={result.match_pct} />%
              </p>
            </article>
            <article className="glass rounded-lg p-5">
              <Metric value={theta} label="Estimasi kemampuan (θ)" />
            </article>
            <article className="glass rounded-lg p-5 sm:col-span-2 lg:col-span-1">
              <h2 className="text-sm font-medium text-text">
                Persepsi vs hasil
              </h2>
              {perceptionScore === null ? (
                <p className="mt-2 leading-6 text-muted">
                  Persepsi kesiapan belum diisi. Hasil asesmen:{" "}
                  <span className="font-mono text-text">
                    {result.match_pct.toFixed(1)}%
                  </span>{" "}
                  dari target Data Analyst.
                </p>
              ) : (
                <p className="mt-2 leading-6 text-muted">
                  Kamu menilai kesiapanmu{" "}
                  <span className="font-mono text-text">
                    {perceptionScore} dari 5
                  </span>
                  . Hasil asesmen:{" "}
                  <span className="font-mono text-text">
                    {result.match_pct.toFixed(1)}%
                  </span>{" "}
                  dari target Data Analyst.
                </p>
              )}
              <p className="mt-2 text-xs leading-5 text-muted">
                Hasil ini estimasi dari 10 soal dan bukan pengganti konselor
                karier.
              </p>
            </article>
          </div>

          <section className="glass flex min-h-[420px] flex-col rounded-lg p-4 sm:p-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-heading text-lg font-semibold text-text">
                Profil delapan skill
              </h2>
              <div
                role="tablist"
                aria-label="Tampilan genome"
                className="flex rounded-md border border-glass-border p-1"
              >
                {(["radar", "galaxy"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    role="tab"
                    aria-selected={activeViewMode === mode}
                    aria-disabled={mode === "galaxy" && !canShowGalaxy}
                    disabled={mode === "galaxy" && !canShowGalaxy}
                    title={
                      mode === "galaxy" && !canShowGalaxy
                        ? "Galaksi tersedia pada layar yang lebih lebar"
                        : undefined
                    }
                    onClick={() => setViewMode(mode)}
                    className={`rounded px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                      activeViewMode === mode
                        ? "bg-primary/20 text-primary-soft"
                        : "text-muted hover:text-text"
                    }`}
                  >
                    {mode === "radar" ? "Radar" : "Galaksi"}
                  </button>
                ))}
              </div>
            </div>
            <div className="min-h-0 flex-1">
              {activeViewMode === "galaxy" ? (
                <GalaxyView
                  mastery={safeMastery}
                  role="data_analyst"
                  focusedSkill={focusedSkill}
                  onSkillFocus={setFocusedSkill}
                />
              ) : (
                <RadarGenome
                  mastery={safeMastery}
                  role="data_analyst"
                  focusedSkill={focusedSkill}
                />
              )}
            </div>
          </section>
        </section>

        <section className="mt-10">
          <div className="mb-5">
            <p className="mb-2 font-mono text-sm text-cyan">
              LANGKAH BELAJAR
            </p>
            <h2 className="font-heading text-2xl font-semibold text-text">
              Skill menurut prioritas
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Prioritas mempertimbangkan gap terhadap mastery 80% dan
              importance setiap skill untuk target Data Analyst.
            </p>
          </div>
          <SkillList
            mastery={safeMastery}
            onSkillFocus={setFocusedSkill}
          />
        </section>

        <section
          aria-label="Aksi lanjutan"
          className="glass sticky bottom-16 z-40 mt-8 rounded-lg border border-glass-border p-3 shadow-xl backdrop-blur-xl lg:bottom-0 sm:p-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/roadmap"
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md bg-primary-strong px-4 font-medium text-white transition-colors hover:bg-primary"
            >
              Lihat roadmap
            </Link>
            <Link
              href="/passport"
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md border border-glass-border px-4 font-medium text-text transition-colors hover:bg-glass"
            >
              Buat Passport
            </Link>
            <button
              type="button"
              onClick={() => setBobOpen(true)}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md border border-glass-border px-4 font-medium text-text transition-colors hover:bg-glass"
            >
              Cara pakai di Bob
            </button>
          </div>
        </section>
        <BobGuideDialog open={bobOpen} onOpenChange={setBobOpen} />
      </main>
      <Footer />
      <BottomTab />
    </>
  );
}
