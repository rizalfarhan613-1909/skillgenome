"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import BottomTab from "@/components/layout/BottomTab";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { RoadmapTimeline } from "@/components/roadmap/RoadmapTimeline";
import { WhatIfPanel } from "@/components/roadmap/WhatIfPanel";
import {
  greedyPath,
  whatIf,
  type Mastery,
  type SkillName,
} from "@/lib/genome-core";
import type { Skill } from "@/lib/types";
import skillData from "@/lib/data/skills.json";
import { useGenomeStore } from "@/store/genome";

type PageStatus = "loading" | "ready" | "error";

const resourcesBySkill = new Map<SkillName, Skill["resources"]>(
  (skillData as Skill[]).map((skill) => [
    skill.name as SkillName,
    skill.resources,
  ]),
);

/** Menampilkan roadmap lima langkah menuju Data Analyst beserta simulasi what-if. */
export default function RoadmapPage() {
  const [pageStatus, setPageStatus] = useState<PageStatus>("loading");
  const [completed, setCompleted] = useState<Set<SkillName>>(() => new Set());
  const mastery = useGenomeStore((state) => state.mastery);

  useEffect(() => {
    let isMounted = true;
    Promise.resolve()
      .then(() => useGenomeStore.persist.rehydrate())
      .then(() => {
        if (isMounted) {
          setPageStatus("ready");
        }
      })
      .catch(() => {
        if (isMounted) {
          setPageStatus("error");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const steps = useMemo(
    () => (mastery ? greedyPath(mastery, "data_analyst", 5) : []),
    [mastery],
  );

  const simulation = useMemo(
    () =>
      mastery
        ? whatIf(mastery, Array.from(completed), "data_analyst")
        : null,
    [mastery, completed],
  );

  const totalHours = useMemo(
    () =>
      steps.reduce(
        (sum, step) =>
          sum +
          (resourcesBySkill.get(step.skill) ?? []).reduce(
            (hours, resource) => hours + resource.hours,
            0,
          ),
        0,
      ),
    [steps],
  );

  const handleToggle = (skill: SkillName) => {
    setCompleted((current) => {
      const next = new Set(current);
      if (next.has(skill)) {
        next.delete(skill);
      } else {
        next.add(skill);
      }
      return next;
    });
  };

  const handleReset = () => setCompleted(new Set());

  if (pageStatus === "loading") {
    return (
      <>
        <Navbar />
        <main className="mx-auto min-h-screen max-w-7xl space-y-6 px-4 py-8 sm:px-6">
          <div className="h-10 w-72 animate-pulse rounded bg-glass" />
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_340px]">
            <div className="h-96 animate-pulse rounded-lg bg-glass" />
            <div className="hidden h-96 animate-pulse rounded-lg bg-glass md:block" />
          </div>
          <p className="sr-only" role="status">
            Memuat roadmap...
          </p>
        </main>
        <Footer />
        <BottomTab />
      </>
    );
  }

  if (pageStatus === "error") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-pink" role="alert">
          Roadmap tidak dapat dimuat dari penyimpanan lokal.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="min-h-11 rounded-md bg-primary-strong px-5 text-sm font-medium text-white"
        >
          Muat ulang
        </button>
      </main>
    );
  }

  if (!mastery || !simulation) {
    return (
      <>
        <Navbar />
        <main className="mx-auto flex min-h-[70vh] max-w-4xl flex-col items-center justify-center px-6 py-16 text-center">
          <p className="mb-3 font-mono text-sm text-cyan">ROADMAP KOSONG</p>
          <h1 className="font-heading text-3xl font-semibold text-text sm:text-4xl">
            Selesaikan asesmen dulu
          </h1>
          <p className="mt-4 max-w-xl leading-7 text-muted">
            Selesaikan asesmen dulu agar langkah belajar bisa disusun.
          </p>
          <Link
            href="/onboarding"
            className="mt-7 inline-flex min-h-12 items-center rounded-md bg-primary-strong px-6 font-semibold text-white transition-colors hover:bg-primary"
          >
            Mulai asesmen
          </Link>
        </main>
        <Footer />
        <BottomTab />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-4 pb-72 pt-7 sm:px-6 md:pb-12 md:pt-10 lg:pb-16">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 font-mono text-sm text-cyan">LANGKAH BELAJAR</p>
            <h1 className="font-heading text-3xl font-semibold text-text sm:text-4xl">
              Roadmap menuju Data Analyst
            </h1>
          </div>
          <p className="text-sm text-muted">
            Total estimasi{" "}
            <span className="font-mono tabular-nums text-text">
              {totalHours} jam
            </span>
          </p>
        </header>

        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_340px] md:items-start">
          <section aria-labelledby="roadmap-steps-heading">
            <h2 id="roadmap-steps-heading" className="sr-only">
              Lima langkah prioritas
            </h2>
            <RoadmapTimeline
              steps={steps}
              completed={completed}
              onToggle={handleToggle}
            />
          </section>

          <aside className="md:sticky md:top-24">
            <WhatIfPanel
              currentMatch={simulation.after}
              delta={simulation.delta}
              before={simulation.before}
              after={simulation.after}
              onReset={handleReset}
            />
          </aside>
        </div>
      </main>
      <Footer />
      <BottomTab />
    </>
  );
}
