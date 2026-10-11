"use client";

import { motion } from "framer-motion";
import skillData from "@/lib/data/skills.json";
import type { RoadmapStep, SkillName } from "@/lib/genome-core";
import { rise, stagger } from "@/lib/motion";
import type { Skill } from "@/lib/types";
import { StepCard } from "./StepCard";

type Resource = Skill["resources"][number];

const resourcesBySkill = new Map<SkillName, Resource[]>(
  (skillData as Skill[]).map((skill) => [
    skill.name as SkillName,
    skill.resources,
  ]),
);

export interface RoadmapTimelineProps {
  steps: RoadmapStep[];
  completed: Set<SkillName>;
  onToggle: (skill: SkillName) => void;
}

/** Menampilkan lima langkah roadmap sebagai timeline vertikal bernomor. */
export function RoadmapTimeline({
  steps,
  completed,
  onToggle,
}: RoadmapTimelineProps) {
  return (
    <motion.ol
      aria-label="Langkah roadmap"
      className="flex flex-col"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const isCompleted = completed.has(step.skill);

        return (
          <motion.li
            key={step.skill}
            variants={rise}
            className={`relative flex gap-4 sm:gap-6 ${isLast ? "" : "pb-8"}`}
          >
            <div className="flex flex-col items-center">
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-full border font-mono text-sm font-semibold tabular-nums ${
                  isCompleted
                    ? "border-green bg-green/15 text-green"
                    : "border-primary bg-primary/15 text-primary-soft"
                }`}
              >
                <span className="sr-only">Langkah </span>
                {index + 1}
              </span>
              {!isLast && (
                <span
                  aria-hidden="true"
                  className="mt-2 w-px flex-1 bg-glass-border"
                />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <StepCard
                step={step}
                completed={isCompleted}
                onToggle={() => onToggle(step.skill)}
                resources={resourcesBySkill.get(step.skill) ?? []}
              />
            </div>
          </motion.li>
        );
      })}
    </motion.ol>
  );
}
