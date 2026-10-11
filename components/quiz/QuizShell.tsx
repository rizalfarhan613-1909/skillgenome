"use client";

import { ArrowLeft, Clock3 } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

interface QuizShellProps {
  current: number;
  total: number;
  elapsedSeconds?: number;
  onBack: () => void;
  children: ReactNode;
}

/** Membungkus kuis dengan kemajuan, timer opsional, dan tombol kembali. */
export function QuizShell({
  current,
  total,
  elapsedSeconds,
  onBack,
  children,
}: QuizShellProps) {
  const reduceMotion = useReducedMotion();
  const progress = total > 0 ? (current / total) * 100 : 0;
  const minutes = Math.floor((elapsedSeconds ?? 0) / 60);
  const seconds = (elapsedSeconds ?? 0) % 60;

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl flex-col px-4 pb-24 pt-6 sm:px-6 lg:min-h-screen lg:pb-12 lg:pt-12">
      <header className="mb-10">
        <div className="mb-5 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-md px-2 py-2 text-sm text-muted transition-colors hover:text-text focus-visible:outline-2 focus-visible:outline-primary-soft"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Kembali
          </button>
          <p
            className="font-mono text-sm text-text"
            aria-live="polite"
            aria-atomic="true"
          >
            Soal {current} dari {total}
          </p>
          {elapsedSeconds !== undefined ? (
            <p
              className="inline-flex min-w-20 items-center justify-end gap-2 font-mono text-sm text-muted"
              aria-label={`Waktu berjalan ${minutes} menit ${seconds} detik`}
            >
              <Clock3 aria-hidden="true" className="size-4" />
              {minutes}:{String(seconds).padStart(2, "0")}
            </p>
          ) : (
            <span className="min-w-20" aria-hidden="true" />
          )}
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-glass"
          role="progressbar"
          aria-label="Kemajuan asesmen"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={current}
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-cyan"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.3 }}
          />
        </div>
      </header>
      {children}
    </main>
  );
}
