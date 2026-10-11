"use client";

import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import BottomTab from "@/components/layout/BottomTab";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import {
  usePrefsStore,
  type Language,
  type TargetRole,
} from "@/store/prefs";

const roleOptions: {
  value: TargetRole;
  label: string;
  available: boolean;
}[] = [
  { value: "data_analyst", label: "Data Analyst", available: true },
  { value: "data_scientist", label: "Data Scientist", available: false },
  { value: "frontend_dev", label: "Frontend Developer", available: false },
  { value: "product_manager", label: "Product Manager", available: false },
  { value: "business_analyst", label: "Business Analyst", available: false },
  { value: "product_analyst", label: "Product Analyst", available: false },
];

const stepTitles = [
  "Pilih target role",
  "Persepsi dan alias",
  "Izin dan preferensi",
] as const;

function parsePerceptionScore(value: string): 1 | 2 | 3 | 4 | 5 | null {
  switch (Number(value)) {
    case 1:
      return 1;
    case 2:
      return 2;
    case 3:
      return 3;
    case 4:
      return 4;
    case 5:
      return 5;
    default:
      return null;
  }
}

/** Menampilkan wizard onboarding tiga langkah sebelum asesmen. */
export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [hydrationStatus, setHydrationStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const targetRole = usePrefsStore((state) => state.targetRole);
  const alias = usePrefsStore((state) => state.alias);
  const perceptionScore = usePrefsStore((state) => state.perceptionScore);
  const consent = usePrefsStore((state) => state.consent);
  const timerEnabled = usePrefsStore((state) => state.timerEnabled);
  const language = usePrefsStore((state) => state.language);
  const setUserId = usePrefsStore((state) => state.setUserId);
  const setRole = usePrefsStore((state) => state.setRole);
  const setAlias = usePrefsStore((state) => state.setAlias);
  const setPerception = usePrefsStore((state) => state.setPerception);
  const toggleConsent = usePrefsStore((state) => state.toggleConsent);
  const setTimer = usePrefsStore((state) => state.setTimer);
  const setLanguage = usePrefsStore((state) => state.setLanguage);

  useEffect(() => {
    let isMounted = true;
    Promise.resolve(usePrefsStore.persist.rehydrate())
      .then(() => {
        if (isMounted) {
          setHydrationStatus("ready");
        }
      })
      .catch(() => {
        if (isMounted) {
          setHydrationStatus("error");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (hydrationStatus === "ready") {
      headingRef.current?.focus();
    }
  }, [currentStep, hydrationStatus]);

  const continueStep = () => {
    if (currentStep === 0 && targetRole !== "data_analyst") {
      return;
    }
    setCurrentStep((step) => Math.min(step + 1, stepTitles.length - 1));
  };

  const startAssessment = () => {
    if (targetRole !== "data_analyst") {
      return;
    }

    setUserId(usePrefsStore.getState().userId ?? crypto.randomUUID());
    router.push("/assessment");
  };

  if (hydrationStatus !== "ready") {
    return (
      <MotionConfig reducedMotion="user">
        <Navbar />
        <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl flex-col px-6 pb-24 pt-10 lg:pb-16 lg:pt-16">
          {hydrationStatus === "loading" ? (
            <p className="text-muted" role="status">
              Memuat preferensi...
            </p>
          ) : (
            <div className="glass rounded-lg p-6">
              <p className="text-text">
                Preferensi tidak dapat dimuat dari penyimpanan lokal.
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-4 min-h-11 rounded-md bg-primary-strong px-5 text-sm font-medium text-white"
              >
                Muat ulang
              </button>
            </div>
          )}
        </main>
        <Footer />
        <BottomTab />
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <Navbar />
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl flex-col px-6 pb-24 pt-10 lg:pb-16 lg:pt-16">
        <div className="mb-8 flex flex-col gap-3">
          <p
            className="text-sm text-primary-soft"
            aria-live="polite"
            aria-atomic="true"
          >
            Langkah {currentStep + 1} dari {stepTitles.length}
          </p>
          <div
            className="flex gap-2"
            role="group"
            aria-label="Progres onboarding"
          >
            {stepTitles.map((title, index) => (
              <span
                key={title}
                aria-label={`Langkah ${index + 1}: ${title}`}
                aria-current={currentStep === index ? "step" : undefined}
                className={`h-1.5 flex-1 rounded-full ${
                  currentStep >= index ? "bg-primary" : "bg-glass-border"
                }`}
              />
            ))}
          </div>
        </div>

        <section className="glass my-auto rounded-lg p-6 sm:p-10">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1
                ref={headingRef}
                tabIndex={-1}
                className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl"
              >
                {stepTitles[currentStep]}
              </h1>

              {currentStep === 0 && (
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {roleOptions.map((role) => {
                    const selected = targetRole === role.value;

                    return (
                      <button
                        key={role.value}
                        type="button"
                        disabled={!role.available}
                        aria-pressed={selected}
                        onClick={() => setRole(role.value)}
                        className={`flex min-h-16 items-center justify-between rounded-md border px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-soft ${
                          selected
                            ? "border-primary bg-primary/10 text-text"
                            : "border-glass-border text-muted"
                        } disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        <span>{role.label}</span>
                        {role.available ? (
                          <span className="text-sm text-primary-soft">
                            Tersedia
                          </span>
                        ) : (
                          <span className="text-sm text-muted">
                            Segera hadir
                          </span>
                        )}
                      </button>
                    );
                  })}
                  <p className="text-sm leading-6 text-muted sm:col-span-2">
                    Saat ini asesmen tersedia untuk Data Analyst. Peran lain
                    akan hadir setelah bank soalnya disiapkan.
                  </p>
                </div>
              )}

              {currentStep === 1 && (
                <div className="mt-6 flex flex-col gap-6">
                  <div className="rounded-md border border-glass-border p-4">
                    <label className="flex items-center gap-3 text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={perceptionScore !== null}
                        onChange={(event) =>
                          setPerception(event.target.checked ? 3 : null)
                        }
                        className="size-4 accent-primary"
                      />
                      Isi persepsi kesiapan (opsional)
                    </label>
                    <div className="mt-4">
                      <div className="flex items-center justify-between gap-3">
                        <label
                          htmlFor="perception-score"
                          className="text-sm text-muted"
                        >
                          Seberapa siap kamu merasa?
                        </label>
                        <span className="font-mono text-sm tabular-nums text-primary-soft">
                          {perceptionScore === null
                            ? "Belum diisi"
                            : `${perceptionScore} dari 5`}
                        </span>
                      </div>
                      <input
                        id="perception-score"
                        type="range"
                        min={1}
                        max={5}
                        step={1}
                        value={perceptionScore ?? 3}
                        disabled={perceptionScore === null}
                        onChange={(event) => {
                          const score = parsePerceptionScore(
                            event.target.value,
                          );
                          if (score !== null) {
                            setPerception(score);
                          }
                        }}
                        className="mt-4 w-full accent-primary"
                      />
                      <div className="flex justify-between text-xs text-muted">
                        <span>Belum siap</span>
                        <span>Sangat siap</span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-muted">
                        Persepsi hanya untuk dibandingkan dengan hasil dan
                        tidak memengaruhi skor asesmen.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="alias" className="text-sm font-medium">
                      Alias <span className="text-muted">(opsional)</span>
                    </label>
                    <input
                      id="alias"
                      type="text"
                      autoComplete="nickname"
                      maxLength={40}
                      value={alias}
                      onChange={(event) => setAlias(event.target.value)}
                      placeholder="Nama yang ingin ditampilkan"
                      className="min-h-11 rounded-md border border-glass-border bg-bg/70 px-3 text-text placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-soft"
                    />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="mt-6 flex flex-col gap-4">
                  <label className="flex min-h-16 items-start gap-3 rounded-md border border-glass-border p-4">
                    <input
                      type="checkbox"
                      checked={consent.store_data}
                      onChange={(event) =>
                        toggleConsent("store_data", event.target.checked)
                      }
                      className="mt-1 size-4 accent-primary"
                    />
                    <span>
                      <span className="block font-medium">
                        Simpan profil dan progres secara lokal
                      </span>
                      <span className="mt-1 block text-sm leading-6 text-muted">
                        Opsional. Jika tidak diaktifkan, profil dan progres
                        asesmen tidak disimpan setelah sesi berakhir.
                      </span>
                    </span>
                  </label>

                  <label className="flex min-h-16 items-start gap-3 rounded-md border border-glass-border p-4">
                    <input
                      type="checkbox"
                      checked={timerEnabled}
                      onChange={(event) => setTimer(event.target.checked)}
                      className="mt-1 size-4 accent-primary"
                    />
                    <span>
                      <span className="block font-medium">
                        Tampilkan timer selama asesmen
                      </span>
                      <span className="mt-1 block text-sm text-muted">
                        Timer tidak memotong waktu atau jawabanmu.
                      </span>
                    </span>
                  </label>

                  <fieldset className="rounded-md border border-glass-border p-4">
                    <legend className="px-1 text-sm font-medium">Bahasa</legend>
                    <div className="mt-2 flex gap-3">
                      {(
                        [
                          ["id", "Bahasa Indonesia"],
                          ["en", "English"],
                        ] as const satisfies readonly [Language, string][]
                      ).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          aria-pressed={language === value}
                          onClick={() => setLanguage(value)}
                          className={`min-h-11 rounded-md border px-4 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-soft ${
                            language === value
                              ? "border-primary bg-primary/10 text-primary-soft"
                              : "border-glass-border text-muted"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                </div>
              )}

              <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  disabled={currentStep === 0}
                  onClick={() =>
                    setCurrentStep((step) => Math.max(step - 1, 0))
                  }
                  className="min-h-11 rounded-md border border-glass-border px-5 text-sm font-medium text-muted transition-colors hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-soft disabled:invisible"
                >
                  Kembali
                </button>
                {currentStep < stepTitles.length - 1 ? (
                  <button
                    type="button"
                    disabled={currentStep === 0 && targetRole !== "data_analyst"}
                    onClick={continueStep}
                    className="min-h-11 rounded-md bg-primary-strong px-5 text-sm font-medium text-white transition-colors hover:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-soft disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Lanjut
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={targetRole !== "data_analyst"}
                    onClick={startAssessment}
                    className="min-h-11 rounded-md bg-primary-strong px-5 text-sm font-medium text-white transition-colors hover:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-soft disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Mulai asesmen
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </section>
      </main>
      <Footer />
      <BottomTab />
    </MotionConfig>
  );
}
