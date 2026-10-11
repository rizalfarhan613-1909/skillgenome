"use client";

import { press } from "@/lib/motion";
import { motion } from "framer-motion";

interface QuestionOptionProps {
  option: string;
  index: number;
  selected: boolean;
  onSelect: (index: number) => void;
}

/** Menampilkan satu pilihan jawaban yang dapat dipilih sebagai radio card. */
export function QuestionOption({
  option,
  index,
  selected,
  onSelect,
}: QuestionOptionProps) {
  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={`${index + 1}. ${option}`}
      variants={press}
      whileHover={press.whileHover}
      whileTap={press.whileTap}
      onClick={() => onSelect(index)}
      className={`glass flex min-h-16 w-full items-center gap-4 rounded-lg px-5 py-4 text-left transition-colors ${
        selected
          ? "border-primary bg-primary/10 text-text"
          : "text-muted hover:border-primary/50 hover:text-text"
      }`}
    >
      <span
        aria-hidden="true"
        className={`flex size-8 shrink-0 items-center justify-center rounded-full border font-mono text-sm ${
          selected
            ? "border-primary bg-primary text-white"
            : "border-glass-border text-muted"
        }`}
      >
        {index + 1}
      </span>
      <span>{option}</span>
    </motion.button>
  );
}
