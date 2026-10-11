"use client";

import { BadgeCheck, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { masteryLevel } from "@/components/passport/PassportCard";
import { SKILLS, type Mastery } from "@/lib/genome-core";

const PASSPORT_STORAGE_KEY = "skillgenome-passports";

interface PassportRecord {
  passportId: string;
  issuedAt: string;
  mastery: Mastery;
  targetRole: string;
  publicPage: boolean;
}

/** Membaca payload passport dari localStorage bila tersedia. */
function readPassport(passportId: string): PassportRecord | null {
  try {
    const raw = window.localStorage.getItem(
      `${PASSPORT_STORAGE_KEY}:${passportId}`,
    );
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as PassportRecord;
  } catch {
    return null;
  }
}

/** Data contoh untuk pratinjau saat passport tidak ada di penyimpanan lokal. */
function demoRecord(passportId: string): PassportRecord {
  return {
    passportId,
    issuedAt: new Date().toISOString(),
    mastery: {
      SQL: 0.55,
      Python: 0.42,
      Statistics: 0.31,
      Excel: 0.88,
      DataViz: 0.62,
      BusinessAcumen: 0.28,
      Communication: 0.49,
      DomainKnowledge: 0.35,
    },
    targetRole: "data_analyst",
    publicPage: true,
  };
}

export interface VerifyPassportContentProps {
  passportId: string;
}

/** Halaman verifikasi publik: level skill dan tanggal tanpa nama atau email. */
export function VerifyPassportContent({
  passportId,
}: VerifyPassportContentProps) {
  const [record, setRecord] = useState<PassportRecord | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const stored = readPassport(passportId);
    if (stored) {
      setRecord(stored);
      setIsDemo(false);
      return;
    }
    setRecord(demoRecord(passportId));
    setIsDemo(true);
  }, [passportId]);

  if (!record) {
    return (
      <main className="mx-auto min-h-screen max-w-3xl space-y-6 px-4 py-8 sm:px-6">
        <div className="h-10 w-72 animate-pulse rounded bg-glass" />
        <div className="h-64 animate-pulse rounded-lg bg-glass" />
        <p className="sr-only" role="status">
          Memuat verifikasi passport...
        </p>
      </main>
    );
  }

  const issuedLabel = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(record.issuedAt));

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <p className="mb-2 flex items-center gap-2 font-mono text-sm text-cyan">
          <ShieldCheck aria-hidden="true" size={16} strokeWidth={1.5} />
          SKILL PASSPORT — VERIFIKASI
        </p>
        <h1 className="font-heading text-3xl font-semibold text-text sm:text-4xl">
          Passport terverifikasi
        </h1>
        <p className="mt-2 font-mono text-sm tabular-nums text-muted">
          {record.passportId}
        </p>
        <p className="mt-1 text-sm text-muted">Terbit {issuedLabel}</p>
      </header>

      {isDemo && (
        <p className="mb-6 rounded-md border border-glass-border bg-glass px-4 py-3 text-sm text-muted">
          Passport ini tidak ditemukan di perangkat ini. Data di bawah adalah
          contoh untuk pratinjau tampilan verifikasi.
        </p>
      )}

      <section aria-label="Level skill" className="glass rounded-lg p-5 sm:p-6">
        <h2 className="font-heading text-lg font-semibold text-text">
          Level skill
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {SKILLS.map((skill) => {
            const value = record.mastery[skill] ?? 0;
            return (
              <li
                key={skill}
                className="flex items-center justify-between gap-3 rounded-md border border-glass-border px-3 py-2"
              >
                <span className="flex items-center gap-2 text-sm text-text">
                  <BadgeCheck
                    aria-hidden="true"
                    size={16}
                    strokeWidth={1.5}
                    className="text-primary-soft"
                  />
                  {skill}
                </span>
                <span className="font-mono text-sm tabular-nums text-primary-soft">
                  {masteryLevel(value)}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-xs leading-5 text-muted">
          Halaman ini hanya menampilkan level skill dan tanggal terbit. Nama
          dan email tidak pernah ditampilkan.
        </p>
      </section>

      <div className="mt-8">
        <Link
          href="/passport"
          className="inline-flex min-h-11 items-center rounded-md border border-glass-border px-5 text-sm font-medium text-text transition-colors hover:bg-glass"
        >
          Buat passport sendiri
        </Link>
      </div>

      <footer className="mt-8 border-t border-glass-border pt-4">
        <p className="text-xs leading-5 text-muted">
          Hasil ini estimasi dari 10 soal dan bukan pengganti konselor karier.
        </p>
      </footer>
    </main>
  );
}

