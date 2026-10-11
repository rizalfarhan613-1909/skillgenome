"use client";

import { useEffect, useState } from "react";
import BottomTab from "@/components/layout/BottomTab";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { RoleCard } from "@/components/jobs/RoleCard";
import { useGenomeStore } from "@/store/genome";
import { SKILLS } from "@/lib/genome-core";
import type { Mastery } from "@/lib/genome-core";
import type { JobMarket } from "@/lib/types";
import jobMarketData from "@/lib/data/job_market.json";

const roles = jobMarketData as JobMarket[];

const emptyMastery = Object.fromEntries(
  SKILLS.map((skill) => [skill, 0]),
) as Mastery;

type PageStatus = "loading" | "ready" | "error";

/** Menampilkan daftar role pasar kerja dan kecocokan genome untuk Data Analyst. */
export default function JobsPage() {
  const [pageStatus, setPageStatus] = useState<PageStatus>("loading");
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

  if (pageStatus === "loading") {
    return (
      <>
        <Navbar />
        <main className="mx-auto min-h-screen max-w-7xl space-y-6 px-4 py-8 sm:px-6">
          <div className="h-10 w-72 animate-pulse rounded bg-glass" />
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-96 animate-pulse rounded-lg bg-glass" />
            <div className="h-96 animate-pulse rounded-lg bg-glass" />
          </div>
          <p className="sr-only" role="status">
            Memuat pasar kerja...
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
          Pasar kerja tidak dapat dimuat dari penyimpanan lokal.
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

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-4 pb-72 pt-7 sm:px-6 md:pb-12 md:pt-10 lg:pb-16">
        <header className="mb-8">
          <p className="mb-2 font-mono text-sm text-cyan">PASAR KERJA</p>
          <h1 className="font-heading text-3xl font-semibold text-text sm:text-4xl">
            Kecocokan dengan role
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Angka gaji dan lowongan bersifat agregat dari dataset dengan cakupan
            benchmark global, bukan data spesifik Indonesia.
          </p>
        </header>

        {!mastery ? (
          <section
            aria-label="Pasar kerja kosong"
            className="glass mb-6 flex flex-col items-center justify-center gap-2 rounded-lg px-6 py-10 text-center"
          >
            <p className="mb-1 font-mono text-sm text-cyan">PASAR KERJA KOSONG</p>
            <h2 className="font-heading text-2xl font-semibold text-text">
              Selesaikan asesmen dulu
            </h2>
            <p className="max-w-xl leading-7 text-muted">
              Selesaikan asesmen dulu agar kecocokan genome dengan tiap role bisa
              dihitung. Role lain tetap bisa dilihat sebagai perbandingan.
            </p>
          </section>
        ) : null}

        <ul className="grid gap-6 md:grid-cols-2">
          {roles.map((role) => (
            <li key={role._id}>
              <RoleCard
                role={role}
                mastery={(mastery ?? emptyMastery) as Mastery}
                isActive={role.name === "data_analyst"}
              />
            </li>
          ))}
        </ul>
      </main>
      <Footer />
      <BottomTab />
    </>
  );
}
