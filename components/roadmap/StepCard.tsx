"use client";

import { Clock, ExternalLink } from "lucide-react";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { SkillChip } from "@/components/ui/SkillChip";
import {
  ROLE_WEIGHTS,
  TARGET_MASTERY,
  type RoadmapStep,
} from "@/lib/genome-core";
import type { Skill } from "@/lib/types";

export type Resource = Skill["resources"][number];

export interface StepCardProps {
  step: RoadmapStep;
  completed: boolean;
  onToggle: () => void;
  resources: Resource[];
}

/** Membuat satu kalimat alasan dari gap mastery dan importance role. */
function buildReason(step: RoadmapStep): string {
  const gapPercent = Math.round(step.gap * 100);
  const importance = ROLE_WEIGHTS.data_analyst[step.skill];
  return `Gap ${gapPercent}% terhadap target ${Math.round(TARGET_MASTERY * 100)}% dengan importance ${importance.toFixed(2)} membuat skill ini prioritas.`;
}

/** Menampilkan satu langkah roadmap beserta alasan, kontribusi, sumber belajar, dan status selesai. */
export function StepCard({
  step,
  completed,
  onToggle,
  resources,
}: StepCardProps) {
  const checkboxId = `step-done-${step.skill}`;

  return (
    <article
      className={`glass rounded-lg p-5 transition-opacity duration-300 ${
        completed ? "opacity-60" : "opacity-100"
      }`}
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <SkillChip skill={step.skill} level={step.mastery} />
          <h3
            className={`font-heading text-lg font-semibold text-text ${
              completed ? "line-through decoration-muted" : ""
            }`}
          >
            {step.skill}
          </h3>
        </div>
      </header>

      <p className="mt-3 text-sm leading-6 text-muted">{buildReason(step)}</p>

      <div className="mt-4">
        <ScoreBar
          value={step.share_pct}
          label="Kontribusi prioritas"
        />
      </div>

      {resources.length > 0 && (
        <div className="mt-5">
          <h4 className="text-sm font-medium text-text">Sumber belajar</h4>
          <ul className="mt-2 space-y-2">
            {resources.map((resource) => (
              <li key={resource.url}>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 items-center justify-between gap-3 rounded-md border border-glass-border px-3 py-2 text-sm text-text transition-colors hover:border-primary/40 hover:bg-glass focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-soft"
                >
                  <span className="min-w-0 truncate">{resource.title}</span>
                  <span className="flex shrink-0 items-center gap-3 text-xs text-muted">
                    <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                      <Clock aria-hidden="true" size={14} strokeWidth={1.5} />
                      {resource.hours} jam
                    </span>
                    <ExternalLink
                      aria-hidden="true"
                      size={16}
                      strokeWidth={1.5}
                      className="text-primary-soft"
                    />
                    <span className="sr-only">(dibuka di tab baru)</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5 border-t border-glass-border pt-4">
        <label
          htmlFor={checkboxId}
          className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-text"
        >
          <input
            id={checkboxId}
            type="checkbox"
            checked={completed}
            onChange={onToggle}
            className="size-4 accent-primary"
          />
          Tandai selesai (simulasi)
        </label>
      </div>
    </article>
  );
}
