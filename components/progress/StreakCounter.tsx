"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { Flame } from "lucide-react";
import { useEffect } from "react";

export interface StreakCounterProps {
  streak: number;
}

/** Penghitung streak dengan count-up, menghormati preferensi reduced motion. */
export function StreakCounter({ streak }: StreakCounterProps) {
  const reduceMotion = useReducedMotion();
  const progress = useMotionValue(streak);
  const rounded = useTransform(progress, (latest) =>
    new Intl.NumberFormat("id-ID").format(Math.round(latest)),
  );

  useEffect(() => {
    const controls = animate(progress, streak, {
      duration: reduceMotion ? 0 : 0.6,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [progress, reduceMotion, streak]);

  return (
    <section
      aria-label="Streak belajar"
      className="glass flex items-center gap-4 rounded-lg p-5"
    >
      <span
        aria-hidden="true"
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary-soft"
      >
        <Flame size={22} strokeWidth={1.5} />
      </span>
      <div>
        <p className="font-mono text-4xl font-semibold tabular-nums text-text">
          <motion.span aria-hidden="true">{rounded}</motion.span>
          <span className="sr-only">{streak}</span>
        </p>
        <p className="text-sm text-muted">hari berturut-turut</p>
      </div>
    </section>
  );
}
