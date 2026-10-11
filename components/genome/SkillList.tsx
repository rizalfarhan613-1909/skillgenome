"use client";

import Link from "next/link";
import {
  greedyPath,
  ROLE_WEIGHTS,
  SKILLS,
  TARGET_MASTERY,
  type Mastery,
  type SkillName,
} from "@/lib/genome-core";
import { ExplainPopover } from "@/components/ui/ExplainPopover";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { SkillChip } from "@/components/ui/SkillChip";

export interface SkillListProps {
  mastery: Mastery;
  onSkillFocus: (skillName: SkillName | null) => void;
}

/** Menampilkan semua skill menurut prioritas jalur belajar. */
export function SkillList({ mastery, onSkillFocus }: SkillListProps) {
  const priorityPath = greedyPath(mastery, "data_analyst", SKILLS.length);
  const prioritySkills = new Set(priorityPath.map((step) => step.skill));
  const orderedSteps = [
    ...priorityPath,
    ...SKILLS.filter((skill) => !prioritySkills.has(skill)).map((skill) => ({
      skill,
      mastery: mastery[skill],
      gap: 0,
      importance: ROLE_WEIGHTS.data_analyst[skill],
      priority: 0,
      share_pct: 0,
    })),
  ];

  return (
    <ol className="space-y-3">
      {orderedSteps.map((step, index) => {
        const gap = Math.max(TARGET_MASTERY - mastery[step.skill], 0);
        return (
          <li
            key={step.skill}
            onMouseEnter={() => onSkillFocus(step.skill)}
            onMouseLeave={() => onSkillFocus(null)}
            onFocusCapture={() => onSkillFocus(step.skill)}
            onBlurCapture={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                onSkillFocus(null);
              }
            }}
            className="glass grid gap-4 rounded-lg p-4 transition-[border-color,box-shadow] hover:border-primary/40 focus-within:border-primary/40 sm:grid-cols-[minmax(150px,1fr)_minmax(180px,2fr)_auto_auto] sm:items-center"
          >
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-muted">
                {String(index + 1).padStart(2, "0")}
              </span>
              <Link
                href={`/genome/${encodeURIComponent(step.skill)}`}
                className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-soft"
                aria-label={`Lihat detail skill ${step.skill}`}
              >
                <SkillChip skill={step.skill} level={mastery[step.skill]} />
              </Link>
            </div>

            <ScoreBar
              value={mastery[step.skill] * 100}
              target={TARGET_MASTERY * 100}
              label={`Penguasaan ${step.skill}`}
            />

            <p className="whitespace-nowrap text-sm text-muted">
              Gap{" "}
              <span className="font-mono tabular-nums text-text">
                {Math.round(gap * 100)}%
              </span>
            </p>

            <ExplainPopover
              skill={step.skill}
              mastery={mastery}
              role="data_analyst"
            />
          </li>
        );
      })}
    </ol>
  );
}
