"use client";

import confetti from "canvas-confetti";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import BottomTab from "@/components/layout/BottomTab";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { PassportCard } from "@/components/passport/PassportCard";
import { ConfirmDialog } from "@/components/passport/ConfirmDialog";
import { Input } from "@/components/ui/input";
import { useGenomeStore } from "@/store/genome";
import { usePrefsStore } from "@/store/prefs";
import type { Mastery } from "@/lib/genome-core";

const PASSPORT_STORAGE_KEY = "skillgenome-passports";
const DRAFT_PASSPORT_ID = "draft-draft-d";

type PageStatus = "loading" | "ready" | "error";
type FlowStage = "draft" | "confirm" | "creating" | "done";

interface StepState {
  label: string;
  status: "pending" | "active" | "done" | "skipped";
}

/** Membuat passportId acak 12 karakter alfanumerik. */
function generatePassportId(): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

/** Menyimpan payload passport ke localStorage agar halaman verifikasi bisa membacanya. */
function persistPassport(payload: {
  passportId: string;
  issuedAt: string;
  mastery: Mastery;
  targetRole: string;
  publicPage: boolean;
}): void {
  try {
    window.localStorage.setItem(
      `${PASSPORT_STORAGE_KEY}:${payload.passportId}`,
      JSON.stringify(payload),
    );
  } catch {
    // Penyimpanan lokal tidak tersedia; halaman verifikasi memakai data contoh.
  }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Menampilkan alur Skill Passport: draft, konfirmasi, pembuatan, dan selesai. */
export default function PassportPage() {
  const [pageStatus, setPageStatus] = useState<PageStatus>("loading");
  const [stage, setStage] = useState<FlowStage>("draft");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [sendEmail, setSendEmail] = useState(false);
  const [publicPage, setPublicPage] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [steps, setSteps] = useState<StepState[]>([
    { label: "Membuat dokumen", status: "pending" },
    { label: "Mengirim email", status: "pending" },
  ]);
  const [passportId, setPassportId] = useState(DRAFT_PASSPORT_ID);
  const [issuedAt, setIssuedAt] = useState("");
  const [confettiFired, setConfettiFired] = useState(false);

  const reduceMotion = useReducedMotion();
  const mastery = useGenomeStore((state) => state.mastery);
  const alias = usePrefsStore((state) => state.alias);
  const targetRole = usePrefsStore((state) => state.targetRole);

  useEffect(() => {
    let isMounted = true;
    Promise.resolve()
      .then(() => usePrefsStore.persist.rehydrate())
      .then(() => useGenomeStore.persist.rehydrate())
      .then(() => {
        if (isMounted) {
          setIssuedAt(new Date().toISOString());
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

  const handleOpenConfirm = () => {
    if (!EMAIL_PATTERN.test(email.trim())) {
      setEmailError("Masukkan alamat email yang valid, misalnya nama@email.com.");
      return;
    }
    setEmailError(null);
    setStage("confirm");
  };

  const handleConfirm = () => {
    setStage("creating");
    const newId = generatePassportId();
    const issued = new Date().toISOString();
    setPassportId(newId);
    setIssuedAt(issued);
    setActiveStep(0);
    setSteps([
      { label: "Membuat dokumen", status: "active" },
      { label: "Mengirim email", status: "pending" },
    ]);

    if (mastery) {
      persistPassport({
        passportId: newId,
        issuedAt: issued,
        mastery,
        targetRole: targetRole ?? "data_analyst",
        publicPage,
      });
    }

    window.setTimeout(() => {
      setSteps((current) => [
        { ...current[0], status: "done" },
        sendEmail
          ? { ...current[1], status: "active" }
          : { ...current[1], status: "skipped" },
      ]);

      if (!sendEmail) {
        setActiveStep(-1);
        setStage("done");
        return;
      }

      setActiveStep(1);
      window.setTimeout(() => {
        setSteps((current) => [
          current[0],
          { ...current[1], status: "done" },
        ]);
        setActiveStep(-1);
        setStage("done");
      }, 1500);
    }, 1500);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/passport/verify/${passportId}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Skill Passport",
          text: "Lihat Skill Passport saya di SkillGenome.",
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(url);
    } catch {
      // Pengguna membatalkan berbagi atau clipboard tidak tersedia.
    }
  };

  useEffect(() => {
    if (stage !== "done" || confettiFired || reduceMotion) {
      return;
    }
    setConfettiFired(true);
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#22D3EE", "#F472B6", "#34D399", "#67E8F9"],
      disableForReducedMotion: true,
    });
  }, [stage, confettiFired, reduceMotion]);

  if (pageStatus === "loading") {
    return (
      <>
        <Navbar />
        <main className="mx-auto min-h-screen max-w-7xl space-y-6 px-4 py-8 sm:px-6">
          <div className="h-10 w-64 animate-pulse rounded bg-glass" />
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="h-96 animate-pulse rounded-lg bg-glass" />
            <div className="h-64 animate-pulse rounded-lg bg-glass" />
          </div>
          <p className="sr-only" role="status">
            Memuat passport...
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
          Passport tidak dapat dimuat dari penyimpanan lokal.
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

  if (!mastery) {
    return (
      <>
        <Navbar />
        <main className="mx-auto flex min-h-[70vh] max-w-4xl flex-col items-center justify-center px-6 py-16 text-center">
          <p className="mb-3 font-mono text-sm text-cyan">PASSPORT KOSONG</p>
          <h1 className="font-heading text-3xl font-semibold text-text sm:text-4xl">
            Selesaikan asesmen dulu
          </h1>
          <p className="mt-4 max-w-xl leading-7 text-muted">
            Selesaikan asesmen dulu agar genome dan Skill Passport bisa dibuat
            dari hasil penguasaan skillmu.
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

  const cardUser = {
    alias,
    targetRole: targetRole ?? "data_analyst",
  };
  const isCreating = stage === "creating";
  const isDone = stage === "done";

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-4 pb-72 pt-7 sm:px-6 md:pb-12 md:pt-10 lg:pb-16">
        <header className="mb-8">
          <p className="mb-2 font-mono text-sm text-cyan">ARTEFAK DAPAT DIBAGIKAN</p>
          <h1 className="font-heading text-3xl font-semibold text-text sm:text-4xl">
            Skill Passport
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Ringkasan penguasaan skill yang bisa dibagikan lewat dokumen dan
            halaman verifikasi. Semua aksi eksternal menunggu persetujuanmu.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <section aria-label="Pratinjau kartu Passport">
            <AnimatePresence mode="wait">
              <motion.div
                key={isDone ? passportId : "draft"}
                initial={reduceMotion ? undefined : { opacity: 0, y: 12 }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <PassportCard
                  user={cardUser}
                  mastery={mastery}
                  passportId={passportId}
                  issuedAt={issuedAt}
              isDraft={stage === "draft"}
                />
              </motion.div>
            </AnimatePresence>
          </section>

          <section aria-label="Formulir Passport" className="glass rounded-lg p-5">
            {isDone ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-green/15 text-green">
                    <Check aria-hidden="true" size={18} strokeWidth={2} />
                  </span>
                  <div>
                    <h2 className="font-heading text-lg font-semibold text-text">
                      Passport dibuat
                    </h2>
                    <p className="font-mono text-xs tabular-nums text-muted">
                      ID {passportId}
                    </p>
                  </div>
                </div>

                <p className="sr-only" role="status">
                  Passport {passportId} berhasil dibuat.
                </p>

                <ul className="space-y-2 text-sm text-muted">
                  {steps.map((step) => (
                    <li key={step.label} className="flex items-center gap-2">
                      {step.status === "done" ? (
                        <Check aria-hidden="true" size={16} className="text-green" />
                      ) : step.status === "skipped" ? (
                        <span className="font-mono text-xs">–</span>
                      ) : null}
                      <span>
                        {step.label}
                        {step.status === "skipped" ? " (dilewati)" : ""}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/passport/verify/${passportId}`}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary-strong px-4 font-medium text-white transition-colors hover:bg-primary"
                >
                  Buka halaman verifikasi
                </Link>

                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-glass-border px-4 font-medium text-text transition-colors hover:bg-glass"
                >
                  Bagikan tautan verifikasi
                </button>

                <p className="text-xs leading-5 text-muted">
                  Hasil ini estimasi dari 10 soal dan bukan pengganti konselor
                  karier.
                </p>
              </div>
            ) : (
              <form
                className="flex flex-col gap-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleOpenConfirm();
                }}
              >
                <h2 className="font-heading text-lg font-semibold text-text">
                  Detail pengiriman
                </h2>

                <div className="flex flex-col gap-2">
                  <label htmlFor="passport-email" className="text-sm text-text">
                    Email
                  </label>
                  <Input
                    id="passport-email"
                    type="email"
                    value={email}
                    disabled={isCreating}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (emailError) {
                        setEmailError(null);
                      }
                    }}
                    placeholder="nama@email.com"
                    className="min-h-11"
                    aria-invalid={emailError ? true : undefined}
                    aria-describedby={
                      emailError ? "passport-email-error" : undefined
                    }
                  />
                  {emailError && (
                    <p
                      id="passport-email-error"
                      role="alert"
                      className="text-sm text-pink"
                    >
                      {emailError}
                    </p>
                  )}
                </div>

                <fieldset className="flex flex-col gap-3" disabled={isCreating}>
                  <legend className="mb-1 text-sm text-text">Izin</legend>

                  <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm text-text">
                    <input
                      type="checkbox"
                      checked={sendEmail}
                      onChange={(event) => setSendEmail(event.target.checked)}
                      className="mt-1 size-4 accent-primary"
                    />
                    <span>
                      Kirim Passport ke email ini
                      <span className="mt-1 block text-xs text-muted">
                        Passport dikirim sebagai dokumen ke alamat di atas.
                      </span>
                    </span>
                  </label>

                  <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm text-text">
                    <input
                      type="checkbox"
                      checked={publicPage}
                      onChange={(event) => setPublicPage(event.target.checked)}
                      className="mt-1 size-4 accent-primary"
                    />
                    <span>
                      Tampilkan halaman verifikasi publik
                      <span className="mt-1 block text-xs text-muted">
                        Tautan verifikasi hanya memuat level skill dan tanggal,
                        tanpa nama atau email.
                      </span>
                    </span>
                  </label>
                </fieldset>

                <button
                  type="submit"
                  disabled={isCreating}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary-strong px-4 font-medium text-white transition-colors hover:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-soft disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Buat Passport
                </button>

                {isCreating && (
                  <div className="space-y-3" aria-live="polite">
                    {steps.map((step, index) => (
                      <div
                        key={step.label}
                        className="flex items-center gap-3 text-sm"
                      >
                        {step.status === "done" ? (
                          <Check
                            aria-hidden="true"
                            size={16}
                            className="text-green"
                          />
                        ) : step.status === "active" ? (
                          <Loader2
                            aria-hidden="true"
                            size={16}
                            className="animate-spin text-primary-soft"
                          />
                        ) : step.status === "skipped" ? (
                          <span className="font-mono text-xs">–</span>
                        ) : (
                          <span className="size-4 rounded-full border border-glass-border" />
                        )}
                        <span
                          className={
                            step.status === "pending" ? "text-muted" : "text-text"
                          }
                        >
                          {step.label}
                          {step.status === "skipped" ? " (dilewati)" : ""}
                          {step.status === "active"
                            ? ` (langkah ${index + 1} dari 2)`
                            : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </form>
            )}
          </section>
        </div>
      </main>

      <ConfirmDialog
        open={stage === "confirm"}
        email={email}
        onConfirm={handleConfirm}
        onCancel={() => setStage("draft")}
      />

      <Footer />
      <BottomTab />
    </>
  );
}

