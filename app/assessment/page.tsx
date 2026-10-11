"use client";

import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import BottomTab from "@/components/layout/BottomTab";
import Navbar from "@/components/layout/Navbar";
import { QuestionOption } from "@/components/quiz/QuestionOption";
import { QuizShell } from "@/components/quiz/QuizShell";
import questionBank from "@/lib/data/questions.json";
import type { Question } from "@/lib/types";
import { useAssessmentStore, type AssessmentQuestion } from "@/store/assessment";
import { usePrefsStore } from "@/store/prefs";

type PageStatus = "loading" | "ready" | "error";

const assessmentQuestions: AssessmentQuestion[] = (
  questionBank as Question[]
)
  .filter((question) => question.role === "data_analyst")
  .slice(0, 10)
  .map(({ _id, skill, difficulty, discrimination, question, options }) => ({
    _id,
    skill,
    difficulty,
    discrimination,
    question,
    options,
  }));

/** Menjalankan asesmen lokal sepuluh soal dengan progres yang dapat dilanjutkan. */
export default function AssessmentPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [pageStatus, setPageStatus] = useState<PageStatus>("loading");
  const [selection, setSelection] = useState<{
    questionId: string;
    choice: number;
  } | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [hydrationError, setHydrationError] = useState<string | null>(null);
  const timerEnabled = usePrefsStore((state) => state.timerEnabled);
  const questions = useAssessmentStore((state) => state.questions);
  const currentIndex = useAssessmentStore((state) => state.currentIndex);
  const answers = useAssessmentStore((state) => state.answers);
  const startedAt = useAssessmentStore((state) => state.startedAt);
  const startSession = useAssessmentStore((state) => state.startSession);
  const answerQuestion = useAssessmentStore((state) => state.answerQuestion);
  const consentStoreData = usePrefsStore((state) => state.consent.store_data);

  useEffect(() => {
    let isMounted = true;

    Promise.resolve()
      .then(() => usePrefsStore.persist.rehydrate())
      .then(() => useAssessmentStore.persist.rehydrate())
      .then(() => {
        if (!isMounted) {
          return;
        }
        if (!usePrefsStore.getState().consent.store_data) {
          useAssessmentStore.getState().reset();
        }

        const session = useAssessmentStore.getState();
        if (session.questions.length === 0) {
          startSession(assessmentQuestions);
        } else if (session.currentIndex >= session.questions.length) {
          router.replace("/assessment/review");
          return;
        }

        setPageStatus("ready");
      })
      .catch(() => {
        if (isMounted) {
          setHydrationError(
            "Progres asesmen tidak dapat dimuat dari penyimpanan lokal.",
          );
          setPageStatus("error");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [router, startSession]);

  const currentQuestion = questions[currentIndex];
  const selectedChoice =
    currentQuestion && selection?.questionId === currentQuestion._id
      ? selection.choice
      : null;

  useEffect(() => {
    if (!timerEnabled || !startedAt || pageStatus !== "ready") {
      return;
    }

    const updateElapsed = () => {
      const startTime = Date.parse(startedAt);
      if (!Number.isFinite(startTime)) {
        setHydrationError("Waktu mulai asesmen tidak valid.");
        setPageStatus("error");
        return;
      }
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startTime) / 1000)));
    };

    updateElapsed();
    const intervalId = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(intervalId);
  }, [pageStatus, startedAt, timerEnabled]);

  const submitAnswer = useCallback(() => {
    if (!currentQuestion || selectedChoice === null) {
      return;
    }

    answerQuestion(currentQuestion._id, selectedChoice);
    if (currentIndex === questions.length - 1) {
      router.push("/assessment/review");
    }
  }, [
    answerQuestion,
    currentIndex,
    currentQuestion,
    questions.length,
    router,
    selectedChoice,
  ]);

  useEffect(() => {
    if (pageStatus !== "ready") {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.repeat ||
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (event.key >= "1" && event.key <= "4") {
        event.preventDefault();
        if (currentQuestion) {
          setSelection({
            questionId: currentQuestion._id,
            choice: Number(event.key) - 1,
          });
        }
      } else if (event.key === "Enter" && selectedChoice !== null) {
        event.preventDefault();
        submitAnswer();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentQuestion, pageStatus, selectedChoice, submitAnswer]);

  if (pageStatus === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <p className="text-muted" role="status">
          Memuat asesmen…
        </p>
      </main>
    );
  }

  if (pageStatus === "error") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-pink" role="alert">
          {hydrationError ?? "Terjadi kesalahan saat memuat asesmen."}
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

  if (!currentQuestion) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <p className="text-muted" role="status">
          Menyiapkan soal berikutnya…
        </p>
      </main>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <Navbar />
      <QuizShell
        current={currentIndex + 1}
        total={questions.length}
        elapsedSeconds={timerEnabled ? elapsedSeconds : undefined}
        onBack={() => router.push("/onboarding")}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.section
            key={currentQuestion._id}
            initial={reduceMotion ? false : { opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: -16 }}
            transition={{ duration: reduceMotion ? 0 : 0.3 }}
            aria-labelledby="question-heading"
          >
            <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-muted">
              <span className="rounded-full border border-glass-border px-3 py-1">
                {currentQuestion.skill}
              </span>
              <span>
                Progres tersimpan: {answers.length} dari {questions.length}{" "}
                jawaban
              </span>
            </div>
            <h1
              id="question-heading"
              tabIndex={-1}
              className="mb-8 text-xl leading-relaxed font-medium text-text sm:text-2xl"
              aria-live="polite"
              aria-atomic="true"
            >
              {currentQuestion.question}
            </h1>

            <div
              role="radiogroup"
              aria-labelledby="question-heading"
              className="flex flex-col gap-3"
            >
              {currentQuestion.options.map((option, index) => (
                <QuestionOption
                  key={`${currentQuestion._id}-${index}`}
                  option={option}
                  index={index}
                  selected={selectedChoice === index}
                  onSelect={(choice) =>
                    setSelection({ questionId: currentQuestion._id, choice })
                  }
                />
              ))}
            </div>

            <p className="mt-5 text-sm text-muted">
              Pilih jawaban terbaik. Gunakan tombol 1-4 untuk memilih dan Enter
              untuk menjawab.
            </p>
            <button
              type="button"
              onClick={submitAnswer}
              disabled={selectedChoice === null}
              className="mt-8 w-full rounded-md bg-primary-strong px-5 py-3 font-semibold text-white transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:min-w-40"
            >
              Jawab
            </button>
          </motion.section>
        </AnimatePresence>
        <aside
          aria-label="Asisten Bob"
          className="fixed bottom-20 right-4 z-30 flex items-center gap-2 rounded-full border border-glass-border bg-bg/90 p-2 shadow-lg backdrop-blur lg:bottom-6"
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-primary-strong font-heading font-bold text-white">
            B
          </span>
          <span className="pr-2 text-xs text-muted">Bob siap membantu</span>
        </aside>
      </QuizShell>
      <BottomTab />
      {!consentStoreData && (
        <p className="sr-only" role="status">
          Progres ini hanya tersedia selama sesi ini karena penyimpanan lokal
          tidak diizinkan.
        </p>
      )}
    </MotionConfig>
  );
}
