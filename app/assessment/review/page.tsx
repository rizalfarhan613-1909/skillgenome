"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import BottomTab from "@/components/layout/BottomTab";
import Navbar from "@/components/layout/Navbar";
import {
  bktReplay,
  estimateTheta,
  matchScore,
  SKILLS,
  type BktResponse,
  type IrtResponse,
  type SkillName,
} from "@/lib/genome-core";
import questionBank from "@/lib/data/questions.json";
import type { Question } from "@/lib/types";
import { useAssessmentStore } from "@/store/assessment";
import { useGenomeStore } from "@/store/genome";
import { usePrefsStore } from "@/store/prefs";

type ReviewFilter = "all" | "incorrect" | "skill";
type PageStatus = "loading" | "ready" | "error";

const questionById = new Map(
  (questionBank as Question[]).map((question) => [question._id, question]),
);

interface CountUpProps {
  value: number;
}

/** Menganimasikan nilai persentase menuju skor asesmen akhir. */
function CountUp({ value }: CountUpProps) {
  const reduceMotion = useReducedMotion();
  const progress = useMotionValue(0);
  const rounded = useTransform(progress, (latest) => Math.round(latest));

  useEffect(() => {
    const animation = animate(progress, value, {
      duration: reduceMotion ? 0 : 1.2,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => animation.stop();
  }, [progress, reduceMotion, value]);

  return <motion.span>{rounded}</motion.span>;
}

/** Menampilkan hasil asesmen, penguasaan skill, dan ulasan jawaban. */
export default function AssessmentReviewPage() {
  const [pageStatus, setPageStatus] = useState<PageStatus>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const [selectedSkill, setSelectedSkill] = useState<SkillName>("SQL");
  const questions = useAssessmentStore((state) => state.questions);
  const answers = useAssessmentStore((state) => state.answers);
  const startedAt = useAssessmentStore((state) => state.startedAt);
  const setGenome = useGenomeStore((state) => state.setGenome);
  const addToHistory = useGenomeStore((state) => state.addToHistory);

  useEffect(() => {
    let isMounted = true;

    Promise.resolve()
      .then(() => usePrefsStore.persist.rehydrate())
      .then(async () => {
        if (usePrefsStore.getState().consent.store_data) {
          await useAssessmentStore.persist.rehydrate();
        }
      })
      .then(() => useGenomeStore.persist.rehydrate())
      .then(() => {
        if (isMounted) {
          setPageStatus("ready");
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoadError("Hasil asesmen tidak dapat dimuat dari penyimpanan lokal.");
          setPageStatus("error");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const reviewedAnswers = useMemo(
    () =>
      answers.flatMap((answer) => {
        const question = questionById.get(answer.question_id);
        return question ? [{ question, answer }] : [];
      }),
    [answers],
  );
  const hasCompleteAssessment =
    questions.length === 10 &&
    answers.length === 10 &&
    reviewedAnswers.length === 10;

  const results = useMemo(() => {
    if (!hasCompleteAssessment) {
      return null;
    }

    const irtResponses: IrtResponse[] = reviewedAnswers.map(
      ({ question, answer }) => ({
        a: question.discrimination,
        b: question.difficulty,
        correct: answer.choice === question.correct,
      }),
    );
    const bktResponses: BktResponse[] = reviewedAnswers.map(
      ({ question, answer }) => ({
        skill: question.skill,
        correct: answer.choice === question.correct,
      }),
    );
    const mastery = bktReplay(bktResponses);
    const matchResult = matchScore(mastery);
    const correctCount = irtResponses.filter(
      (response) => response.correct,
    ).length;
    const skillBreakdown = SKILLS.map((skill) => {
      const skillQuestions = reviewedAnswers.filter(
        ({ question }) => question.skill === skill,
      );
      const skillCorrect = skillQuestions.filter(
        ({ question, answer }) => answer.choice === question.correct,
      ).length;

      return {
        skill,
        masteryPercent: Math.round(mastery[skill] * 100),
        resultLabel:
          skillQuestions.length === 0
            ? "Belum diuji"
            : `${skillCorrect}/${skillQuestions.length} benar`,
      };
    });

    return {
      theta: estimateTheta(irtResponses),
      mastery,
      matchDetails: matchResult,
      match: matchResult.match_pct,
      scorePercent: Math.round((correctCount / irtResponses.length) * 100),
      correctCount,
      skillBreakdown,
    };
  }, [hasCompleteAssessment, reviewedAnswers]);

  useEffect(() => {
    if (pageStatus === "ready" && results && startedAt) {
      setGenome(results.mastery, results.theta, results.matchDetails, startedAt);
      addToHistory();
    }
  }, [addToHistory, pageStatus, results, setGenome, startedAt]);

  const visibleAnswers = reviewedAnswers.filter(({ question, answer }) => {
    if (filter === "incorrect" && answer.choice === question.correct) {
      return false;
    }
    return filter !== "skill" || question.skill === selectedSkill;
  });

  if (pageStatus === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <p role="status" className="text-muted">
          Memuat hasil asesmen…
        </p>
      </main>
    );
  }

  if (pageStatus === "error") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p role="alert" className="text-pink">
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

  return (
    <>
      <Navbar />
      <main className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-28 pt-8 sm:px-6 lg:pb-16 lg:pt-12">
        <header className="mb-8">
          <p className="mb-2 font-mono text-sm text-cyan">HASIL ASESMEN</p>
          <h1 className="font-heading text-3xl font-semibold text-text sm:text-4xl">
            Tinjau jawabanmu
          </h1>
          <p className="mt-3 max-w-2xl text-muted">
            Pelajari alasan di balik setiap jawaban dan lihat gambaran awal
            penguasaan skill-mu.
          </p>
        </header>

        {!hasCompleteAssessment || !results ? (
          <section className="glass rounded-lg p-8 text-center sm:p-12">
            <h2 className="font-heading text-2xl font-semibold text-text">
              Belum ada asesmen yang selesai
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-muted">
              Selesaikan 10 soal terlebih dahulu agar skor dan pembahasan
              jawaban dapat ditampilkan.
            </p>
            <Link
              href="/onboarding"
              className="mt-6 inline-flex rounded-md bg-primary-strong px-5 py-3 font-semibold text-white transition-colors hover:bg-primary"
            >
              Mulai asesmen
            </Link>
          </section>
        ) : (
          <>
            <section
              aria-label="Ringkasan skor"
              className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              <article className="glass glow-primary rounded-lg p-6 sm:col-span-2">
                <p className="text-sm text-muted">Jawaban benar</p>
                <p className="mt-2 font-mono text-5xl font-semibold tabular-nums text-text">
                  <CountUp value={results.scorePercent} />%
                </p>
                <p className="mt-2 text-sm text-muted">
                  {results.correctCount} dari 10 soal
                </p>
              </article>
              <article className="glass rounded-lg p-6">
                <p className="text-sm text-muted">Match Data Analyst</p>
                <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-primary-soft">
                  {results.match.toFixed(1)}%
                </p>
              </article>
              <article className="glass rounded-lg p-6">
                <p className="text-sm text-muted">Estimasi theta</p>
                <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-cyan">
                  {results.theta.toFixed(2)}
                </p>
              </article>
            </section>
            <div className="mb-8">
              <Link
                href="/genome"
                className="inline-flex min-h-11 items-center rounded-md bg-primary-strong px-5 py-3 font-semibold text-white transition-colors hover:bg-primary"
              >
                Lihat genome
              </Link>
            </div>

            <section className="glass mb-8 rounded-lg p-5 sm:p-7">
              <div className="mb-5">
                <h2 className="font-heading text-xl font-semibold text-text">
                  Ringkasan per skill
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Penguasaan dihitung lokal dengan Bayesian Knowledge Tracing.
                </p>
              </div>
              <div
                className="h-[340px] w-full"
                role="img"
                aria-label="Grafik estimasi mastery Bayesian per skill"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={results.skillBreakdown}
                    layout="vertical"
                    margin={{ top: 4, right: 20, bottom: 4, left: 8 }}
                  >
                    <CartesianGrid
                      horizontal={false}
                      stroke="rgb(255 255 255 / 0.08)"
                    />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      tickFormatter={(value: number) => `${value}%`}
                      tick={{ fill: "#94A3B8", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="skill"
                      width={142}
                      tick={{ fill: "#F1F5F9", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value) => [`${value}%`, "Estimasi mastery"]}
                      contentStyle={{
                        background: "#0A0A1A",
                        border: "1px solid rgb(255 255 255 / 0.08)",
                        borderRadius: 12,
                      }}
                    />
                    <Bar
                      dataKey="masteryPercent"
                      name="Estimasi mastery"
                      fill="#22D3EE"
                      radius={[0, 6, 6, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                {results.skillBreakdown.map((skillResult) => (
                  <li
                    key={skillResult.skill}
                    className="flex justify-between gap-3 text-muted"
                  >
                    <span>{skillResult.skill}</span>
                    <span className="text-text">{skillResult.resultLabel}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="answer-review-heading">
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2
                    id="answer-review-heading"
                    className="font-heading text-xl font-semibold text-text"
                  >
                    Pembahasan soal
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    Kunci jawaban dan penjelasan ditampilkan setelah asesmen
                    selesai.
                  </p>
                </div>
                {filter === "skill" && (
                  <label className="flex flex-col gap-2 text-sm text-muted">
                    Pilih skill
                    <select
                      value={selectedSkill}
                      onChange={(event) => {
                        const skill = SKILLS.find(
                          (candidate) => candidate === event.target.value,
                        );
                        if (skill) {
                          setSelectedSkill(skill);
                        }
                      }}
                      className="rounded-md border border-glass-border bg-bg px-3 py-2 text-text"
                    >
                      {SKILLS.map((skill) => (
                        <option key={skill} value={skill}>
                          {skill}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>

              <div
                role="tablist"
                aria-label="Filter pembahasan"
                className="mb-4 flex flex-wrap gap-2"
              >
                {(
                  [
                    ["all", "Semua"],
                    ["incorrect", "Salah"],
                    ["skill", "Per skill"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={filter === value}
                    onClick={() => setFilter(value)}
                    className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                      filter === value
                        ? "border-primary bg-primary/15 text-primary-soft"
                        : "border-glass-border text-muted hover:text-text"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {visibleAnswers.length === 0 ? (
                <p className="glass rounded-lg p-6 text-muted" role="status">
                  Tidak ada jawaban pada filter ini.
                </p>
              ) : (
                <div className="space-y-3">
                  {visibleAnswers.map(({ question, answer }, index) => {
                    const isCorrect = answer.choice === question.correct;
                    return (
                      <details
                        key={question._id}
                        className="glass group rounded-lg"
                      >
                        <summary className="flex cursor-pointer list-none items-start justify-between gap-4 p-5 [&::-webkit-details-marker]:hidden">
                          <span className="flex items-start gap-3">
                            <span
                              aria-hidden="true"
                              className={`mt-0.5 size-2.5 shrink-0 rounded-full ${
                                isCorrect ? "bg-green" : "bg-pink"
                              }`}
                            />
                            <span className="font-medium leading-relaxed text-text">
                              {index + 1}. {question.question}
                            </span>
                          </span>
                          <span className="shrink-0 text-muted transition-transform group-open:rotate-180">
                            ⌄
                          </span>
                        </summary>
                        <div className="space-y-4 border-t border-glass-border px-5 py-5">
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="rounded-full bg-primary/15 px-3 py-1 text-primary-soft">
                              {question.skill}
                            </span>
                            <span className="rounded-full bg-glass px-3 py-1 text-muted">
                              Kesulitan {question.difficulty > 0 ? "+" : ""}
                              {question.difficulty.toFixed(1)}
                            </span>
                          </div>
                          <p className={isCorrect ? "text-green" : "text-pink"}>
                            Jawabanmu: {question.options[answer.choice]}
                            {isCorrect ? " — benar" : " — belum tepat"}
                          </p>
                          <p className="text-green">
                            Jawaban benar: {question.options[question.correct]}
                          </p>
                          <p className="leading-relaxed text-muted">
                            {question.explanation}
                          </p>
                        </div>
                      </details>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>
      <BottomTab />
    </>
  );
}
