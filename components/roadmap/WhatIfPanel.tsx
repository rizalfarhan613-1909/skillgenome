"use client";

import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

export interface WhatIfPanelProps {
  currentMatch: number;
  delta: number;
  before: number;
  after: number;
  onReset: () => void;
}

const numberFormat = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const signedFormat = new Intl.NumberFormat("id-ID", {
  signDisplay: "always",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** Menampilkan match% sebelum dan sesudah simulasi, dengan count-up saat berubah. */
function CountUpPercent({ value }: { value: number }) {
  const reduceMotion = useReducedMotion();
  const progress = useMotionValue(value);
  const rounded = useTransform(progress, (latest) =>
    numberFormat.format(latest),
  );

  useEffect(() => {
    const controls = animate(progress, value, {
      duration: reduceMotion ? 0 : 0.5,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [progress, reduceMotion, value]);

  return <motion.span aria-hidden="true">{rounded}</motion.span>;
}

/** Panel simulasi what-if: sticky di desktop, bottom sheet di mobile. */
export function WhatIfPanel({
  currentMatch,
  delta,
  before,
  after,
  onReset,
}: WhatIfPanelProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const hasGain = delta > 0;
  const deltaTone = hasGain ? "text-green" : "text-muted";
  const summary = `Match ${numberFormat.format(currentMatch)} persen. Perubahan ${signedFormat.format(delta)} poin dari ${numberFormat.format(before)} persen.`;

  return (
    <section
      aria-label="Simulasi what-if"
      className={`glass glow-primary fixed inset-x-0 bottom-16 z-50 rounded-t-xl border-t border-glass-border p-5 md:static md:rounded-lg md:border ${
        mobileOpen ? "" : "max-md:pb-4"
      }`}
    >
      <button
        type="button"
        aria-expanded={mobileOpen}
        aria-controls="what-if-body"
        onClick={() => setMobileOpen((open) => !open)}
        className="mb-3 flex min-h-11 w-full items-center justify-between gap-3 md:hidden"
      >
        <span className="font-heading text-base font-semibold text-text">
          Simulasi what-if
        </span>
        <span className="flex items-center gap-2 font-mono text-sm tabular-nums text-primary-soft">
          {numberFormat.format(currentMatch)}%
          {mobileOpen ? (
            <ChevronDown aria-hidden="true" size={18} />
          ) : (
            <ChevronUp aria-hidden="true" size={18} />
          )}
        </span>
      </button>

      <div
        id="what-if-body"
        className={`${mobileOpen ? "block" : "hidden"} md:block`}
      >
        <h2 className="hidden font-heading text-lg font-semibold text-text md:block">
          Simulasi what-if
        </h2>

        <div className="mt-2 md:mt-4">
          <p className="text-sm text-muted">Match Data Analyst</p>
          <p className="mt-1 font-mono text-5xl font-semibold tabular-nums text-primary-soft">
            <CountUpPercent value={currentMatch} />
            <span className="ml-1 text-2xl">%</span>
          </p>
          <p className="mt-2 font-mono text-sm tabular-nums text-muted">
            Sebelum {numberFormat.format(before)}% → sesudah{" "}
            {numberFormat.format(after)}%
          </p>
        </div>

        <div
          className={`mt-4 inline-flex items-center gap-2 rounded-md border border-glass-border px-3 py-2 font-mono text-sm tabular-nums ${deltaTone}`}
        >
          <span>{signedFormat.format(delta)} poin</span>
          {!hasGain && <span className="text-xs">(tidak berubah)</span>}
        </div>

        <button
          type="button"
          onClick={onReset}
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-glass-border px-4 text-sm font-medium text-text transition-colors hover:bg-glass focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-soft"
        >
          <RotateCcw aria-hidden="true" size={16} strokeWidth={1.5} />
          Setel ulang simulasi
        </button>
      </div>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {summary}
      </p>
    </section>
  );
}
